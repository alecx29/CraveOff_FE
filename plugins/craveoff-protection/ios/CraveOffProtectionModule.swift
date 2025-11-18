import Foundation
import FamilyControls
import ManagedSettings
import React

@objc(CraveOffProtection)
class CraveOffProtection: NSObject {
  private var lastBlocklist: Set<String> = []

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }

  private func normalizeDomains(_ domains: [String]) -> Set<String> {
    var out = Set<String>()
    for d in domains {
      var s = d.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
      if s.hasPrefix("http://") { s.removeFirst(7) }
      if s.hasPrefix("https://") { s.removeFirst(8) }
      if s.hasPrefix("www.") { s.removeFirst(4) }
      if s.hasSuffix("/") { s.removeLast() }
      if !s.isEmpty { out.insert(s) }
    }
    return out
  }

  @objc func enable(_ resolve: @escaping RCTPromiseResolveBlock,
                    rejecter reject: @escaping RCTPromiseRejectBlock) {
    if #available(iOS 16.0, *) {
      Task { @MainActor in
        do {
          try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
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
          let diagnostic = " (domain=\(nsError.domain), code=\(nsError.code))"
          reject("AUTH_ERROR", message + diagnostic, error)
        }
      }
    } else {
      resolve(false)
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
      // Clear local blocklist reference
      lastBlocklist = []
      // Clear ManagedSettings Web Content filter
      let store = ManagedSettingsStore()
      store.webContentFilter = nil
      resolve(true)
    } else {
      resolve(false)
    }
  }

  @objc func applyBlocklist(_ domains: [String],
                            resolver resolve: RCTPromiseResolveBlock,
                            rejecter reject: RCTPromiseRejectBlock) {
    if #available(iOS 16.0, *) {
      lastBlocklist = normalizeDomains(domains)
      // Apply ManagedSettings Web Content filter: automatic with blocked exceptions
      let store = ManagedSettingsStore()
      let blocked: Set<WebDomain> = Set(lastBlocklist.map { WebDomain($0) })
      // Keep allowlist empty; block explicit domains via exceptions
      store.webContentFilter = .automatic(exceptions: .init(allowed: [], blocked: blocked))
      resolve(true)
    } else {
      resolve(false)
    }
  }

  @objc func status(_ resolve: RCTPromiseResolveBlock,
                    rejecter reject: RCTPromiseRejectBlock) {
    var running = false
    if #available(iOS 16.0, *) {
      let store = ManagedSettingsStore()
      running = (store.webContentFilter != nil)
    } else {
      running = false
    }
    let result: [String: Any] = [
      "running": running,
      "blocklistSize": lastBlocklist.count,
      "mode": "dns-only" // Keep API parity with Android
    ]
    resolve(result)
  }
}


