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
  private let applicationTokensKey = "craveoff.protection.applicationTokens.v1"
  private let categoryTokensKey = "craveoff.protection.categoryTokens.v1"

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
  private func loadTokenSet<T: Codable & Hashable>(_ key: String) -> Set<T> {
    guard let data = defaults.data(forKey: key) else { return [] }
    do {
      let decoded = try JSONDecoder().decode([T].self, from: data)
      return Set(decoded)
    } catch {
      NSLog("CraveOff[iOS]: Failed to decode saved token set (key=\(key)): \(error.localizedDescription)")
      return []
    }
  }

  @available(iOS 16.0, *)
  private func saveTokenSet<T: Codable>(_ tokens: Set<T>, key: String) {
    do {
      let data = try JSONEncoder().encode(Array(tokens))
      defaults.set(data, forKey: key)
    } catch {
      NSLog("CraveOff[iOS]: Failed to encode token set (key=\(key)): \(error.localizedDescription)")
    }
  }

  @available(iOS 16.0, *)
  private func applyShield(selection: FamilyActivitySelection) {
    let store = ManagedSettingsStore()
    let web = selection.webDomainTokens
    let apps = selection.applicationTokens
    let cats = selection.categoryTokens

    // Web domains
    store.shield.webDomains = web.isEmpty ? nil : web
    // Applications + categories (the system picker allows selecting these too)
    store.shield.applications = apps.isEmpty ? nil : apps
    // NOTE: `applicationCategories` takes a policy, not a raw set of tokens.
    store.shield.applicationCategories = cats.isEmpty ? nil : .specific(cats)

    NSLog("CraveOff[iOS]: Applied shields web=\(web.count) apps=\(apps.count) categories=\(cats.count)")
  }

  @available(iOS 16.0, *)
  private func clearShield() {
    let store = ManagedSettingsStore()
    store.shield.webDomains = nil
    store.shield.applications = nil
    store.shield.applicationCategories = nil
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
      let existingWebTokens: Set<WebDomainToken> = loadTokenSet(webDomainTokensKey)
      let existingAppTokens: Set<ApplicationToken> = loadTokenSet(applicationTokensKey)
      let existingCategoryTokens: Set<ActivityCategoryToken> = loadTokenSet(categoryTokensKey)
      var initialSelection = FamilyActivitySelection()
      initialSelection.webDomainTokens = existingWebTokens
      initialSelection.applicationTokens = existingAppTokens
      initialSelection.categoryTokens = existingCategoryTokens

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

            NSLog(
              "CraveOff[iOS]: Website picker DONE selection: webDomains=\(selection.webDomainTokens.count), apps=\(selection.applicationTokens.count), categories=\(selection.categoryTokens.count), trimmed=\(trimmed)"
            )
            let web = selection.webDomainTokens
            let apps = selection.applicationTokens
            let cats = selection.categoryTokens

            if web.isEmpty && apps.isEmpty && cats.isEmpty {
              self.setEnabledFlag(false)
              reject("EMPTY_SELECTION", "Please select at least one item to block (website/app/category).", nil)
              return
            }

            self.saveTokenSet(web, key: self.webDomainTokensKey)
            self.saveTokenSet(apps, key: self.applicationTokensKey)
            self.saveTokenSet(cats, key: self.categoryTokensKey)
            self.setEnabledFlag(true)
            self.applyShield(selection: selection)

            resolve([
              "cancelled": false,
              // Keep compatibility with JS (it reads `selectedCount`).
              "selectedCount": web.count + apps.count + cats.count,
              "selectedWebsitesCount": web.count,
              "selectedAppsCount": apps.count,
              "selectedCategoriesCount": cats.count,
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
      let web: Set<WebDomainToken> = loadTokenSet(webDomainTokensKey)
      let apps: Set<ApplicationToken> = loadTokenSet(applicationTokensKey)
      let cats: Set<ActivityCategoryToken> = loadTokenSet(categoryTokensKey)

      count = web.count + apps.count + cats.count
      if enabled && count > 0 {
        var selection = FamilyActivitySelection()
        selection.webDomainTokens = web
        selection.applicationTokens = apps
        selection.categoryTokens = cats
        applyShield(selection: selection)
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
  @State private var dismissalIntent: DismissalIntent? = nil
  private let maxCount: Int
  private let onCancel: () -> Void
  private let onDone: (FamilyActivitySelection, Bool) -> Void

  private enum DismissalIntent {
    case cancel
    case done
  }

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
            // NOTE: The FamilyActivityPicker may only commit its selection back into the binding
            // when it disappears. We defer reading selection until onDisappear.
            dismissalIntent = .cancel
            dismiss()
          }
        }
        ToolbarItem(placement: .confirmationAction) {
          Button("Done") {
            // Defer reading `selection.webDomainTokens` until onDisappear.
            dismissalIntent = .done
            dismiss()
          }
        }
      }
    }
    .onDisappear {
      // Defer to next runloop tick to give the system picker a chance to flush state into our binding.
      // If the sheet is dismissed interactively (swipe-down), treat it as Cancel to avoid a hanging JS promise.
      let intent = dismissalIntent ?? .cancel
      DispatchQueue.main.async {
        switch intent {
        case .cancel:
          onCancel()
        case .done:
          var trimmed = false
          var out = selection
          var tokens = out.webDomainTokens
          if tokens.count > maxCount {
            trimmed = true
            tokens = Set(Array(tokens).prefix(maxCount))
          }
          out.webDomainTokens = tokens
          onDone(out, trimmed)
        }
      }
    }
  }
}


