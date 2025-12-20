import Foundation
import FamilyControls
import ManagedSettings
import React
import SwiftUI
import UIKit

@objc(CraveOffProtection)
class CraveOffProtection: NSObject {
  private let defaults = UserDefaults.standard
  private let enabledKey = "craveoff.protection.enabled"
  private let webDomainTokensKey = "craveoff.protection.webDomainTokens.v1"

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @available(iOS 16.0, *)
  private func statusString(_ status: AuthorizationStatus) -> String {
    switch status {
    case .approved: return "approved"
    case .denied: return "denied"
    case .notDetermined: return "notDetermined"
    @unknown default: return "unknown"
    }
  }

  private func setEnabledFlag(_ enabled: Bool) {
    defaults.set(enabled, forKey: enabledKey)
  }

  private func isEnabledFlag() -> Bool {
    return defaults.bool(forKey: enabledKey)
  }

  @available(iOS 16.0, *)
  private func loadWebDomainTokens() -> Set<WebDomainToken> {
    guard let data = defaults.data(forKey: webDomainTokensKey) else { return [] }
    do {
      let decoded = try JSONDecoder().decode([WebDomainToken].self, from: data)
      return Set(decoded)
    } catch {
      NSLog("CraveOff[iOS]: Failed to decode saved webDomainTokens: \(error.localizedDescription)")
      return []
    }
  }

  @available(iOS 16.0, *)
  private func saveWebDomainTokens(_ tokens: Set<WebDomainToken>) {
    do {
      let data = try JSONEncoder().encode(Array(tokens))
      defaults.set(data, forKey: webDomainTokensKey)
    } catch {
      NSLog("CraveOff[iOS]: Failed to encode webDomainTokens: \(error.localizedDescription)")
    }
  }

  @available(iOS 16.0, *)
  private func applyShield(tokens: Set<WebDomainToken>) {
    let store = ManagedSettingsStore()
    store.shield.webDomains = tokens
    NSLog("CraveOff[iOS]: Applied shield.webDomains tokens=\(tokens.count)")
  }

  @available(iOS 16.0, *)
  private func clearShield() {
    let store = ManagedSettingsStore()
    store.shield.webDomains = nil
    NSLog("CraveOff[iOS]: Cleared shield.webDomains")
  }

  private func topViewController() -> UIViewController? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let keyWindow = scenes.flatMap { $0.windows }.first(where: { $0.isKeyWindow })
    var top = keyWindow?.rootViewController
    while true {
      if let presented = top?.presentedViewController {
        top = presented
        continue
      }
      if let nav = top as? UINavigationController {
        top = nav.visibleViewController
        continue
      }
      if let tab = top as? UITabBarController {
        top = tab.selectedViewController
        continue
      }
      break
    }
    return top
  }

  @objc func enable(_ resolve: @escaping RCTPromiseResolveBlock,
                    rejecter reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 16.0, *) {
      Task { @MainActor in
        do {
          // Log current authorization status before requesting
          let before = AuthorizationCenter.shared.authorizationStatus
          let beforeS = statusString(before)
          NSLog("CraveOff[iOS]: FamilyControls authorizationStatus BEFORE request: \(beforeS)")

          try await AuthorizationCenter.shared.requestAuthorization(for: .individual)

          // Log status after request (may still be the same if user cancelled)
          let after = AuthorizationCenter.shared.authorizationStatus
          let afterS = statusString(after)
          NSLog("CraveOff[iOS]: FamilyControls authorizationStatus AFTER request: \(afterS)")

          resolve(true)
        } catch {
          let nsError = error as NSError
          var message = nsError.localizedDescription
          // Provide a clearer hint based on current authorization status when available
          let status = AuthorizationCenter.shared.authorizationStatus
          switch status {
          case .approved:
            message = "Authorization already approved but request failed. Please try again."
          case .denied:
            message = "Family Controls authorization denied."
          case .notDetermined:
            message = "Family Controls authorization not determined."
          @unknown default:
            break
          }
          // Append low-level diagnostics for troubleshooting (domain/code)
          let statusS = statusString(status)
          let diagnostic = " (domain=\(nsError.domain), code=\(nsError.code), status=\(statusS))"
          NSLog("CraveOff[iOS]: requestAuthorization failed: \(message)\(diagnostic) full=\(String(describing: error))")
          reject("AUTH_ERROR", message + diagnostic, error)
        }
      }
    } else {
      resolve(false)
    }
  }

  @objc func configureWebsites(_ maxCount: NSNumber,
                               resolver resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 16.0, *) {
      let status = AuthorizationCenter.shared.authorizationStatus
      guard status == .approved else {
        reject("NOT_AUTHORIZED", "Family Controls authorization is not approved (status=\(statusString(status))).", nil)
        return
      }

      let max = max(1, min(20, maxCount.intValue))
      let existingTokens = loadWebDomainTokens()
      var initialSelection = FamilyActivitySelection()
      initialSelection.webDomainTokens = existingTokens

      DispatchQueue.main.async {
        guard let presenter = self.topViewController() else {
          reject("NO_VIEW_CONTROLLER", "Cannot find a view controller to present the website picker.", nil)
          return
        }

        var didResolve = false
        let view = WebDomainPickerView(
          initialSelection: initialSelection,
          maxCount: max,
          onCancel: {
            if didResolve { return }
            didResolve = true
            self.setEnabledFlag(false)
            resolve(["cancelled": true])
          },
          onDone: { selection, trimmed in
            if didResolve { return }
            didResolve = true

            let tokens = selection.webDomainTokens
            if tokens.isEmpty {
              self.setEnabledFlag(false)
              reject("EMPTY_SELECTION", "Please select at least one website to block.", nil)
              return
            }

            self.saveWebDomainTokens(tokens)
            self.setEnabledFlag(true)
            self.applyShield(tokens: tokens)

            resolve([
              "cancelled": false,
              "selectedCount": tokens.count,
              "trimmed": trimmed
            ])
          }
        )

        let host = UIHostingController(rootView: view)
        host.modalPresentationStyle = .formSheet
        presenter.present(host, animated: true)
      }
    } else {
      resolve(["cancelled": false, "selectedCount": 0, "trimmed": false])
    }
  }

  @objc func authorizationStatus(_ resolve: RCTPromiseResolveBlock,
                                 rejecter reject: RCTPromiseRejectBlock) {
    if #available(iOS 16.0, *) {
      let status = AuthorizationCenter.shared.authorizationStatus
      switch status {
      case .approved:
        resolve("approved")
      case .denied:
        resolve("denied")
      case .notDetermined:
        resolve("notDetermined")
      @unknown default:
        resolve("unknown")
      }
    } else {
      resolve("unavailable")
    }
  }

  @objc func disable(_ resolve: RCTPromiseResolveBlock,
                     rejecter reject: RCTPromiseRejectBlock) {
    if #available(iOS 16.0, *) {
      setEnabledFlag(false)
      clearShield()
      resolve(true)
    } else {
      resolve(false)
    }
  }

  @objc func applyBlocklist(_ domains: [String],
                            resolver resolve: RCTPromiseResolveBlock,
                            rejecter reject: RCTPromiseRejectBlock) {
    reject("UNSUPPORTED", "On iOS, websites must be selected by the user via the Family Controls picker.", nil)
  }

  @objc func status(_ resolve: RCTPromiseResolveBlock,
                    rejecter reject: RCTPromiseRejectBlock) {
    var running = false
    var count = 0
    if #available(iOS 16.0, *) {
      let enabled = isEnabledFlag()
      let tokens = loadWebDomainTokens()
      count = tokens.count
      if enabled && !tokens.isEmpty {
        applyShield(tokens: tokens)
        running = true
      } else {
        running = false
      }
    } else {
      running = false
    }
    let result: [String: Any] = [
      "running": running,
      "blocklistSize": count,
      "mode": "dns-only" // Keep API parity with Android
    ]
    resolve(result)
  }
}

@available(iOS 16.0, *)
private struct WebDomainPickerView: View {
  @Environment(\.dismiss) private var dismiss
  @State private var selection: FamilyActivitySelection
  private let maxCount: Int
  private let onCancel: () -> Void
  private let onDone: (FamilyActivitySelection, Bool) -> Void

  init(
    initialSelection: FamilyActivitySelection,
    maxCount: Int,
    onCancel: @escaping () -> Void,
    onDone: @escaping (FamilyActivitySelection, Bool) -> Void
  ) {
    _selection = State(initialValue: initialSelection)
    self.maxCount = maxCount
    self.onCancel = onCancel
    self.onDone = onDone
  }

  var body: some View {
    NavigationView {
      VStack(alignment: .leading, spacing: 12) {
        Text("Choose up to \(maxCount) websites to block.")
          .font(.subheadline)
          .foregroundColor(.secondary)
          .padding(.horizontal)
          .padding(.top, 8)

        FamilyActivityPicker(selection: $selection)
      }
      .navigationTitle("Blocked Websites")
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button("Cancel") {
            dismiss()
            onCancel()
          }
        }
        ToolbarItem(placement: .confirmationAction) {
          Button("Done") {
            var trimmed = false
            var out = FamilyActivitySelection()
            var tokens = selection.webDomainTokens
            if tokens.count > maxCount {
              trimmed = true
              tokens = Set(Array(tokens).prefix(maxCount))
            }
            out.webDomainTokens = tokens
            dismiss()
            onDone(out, trimmed)
          }
        }
      }
    }
  }
}


