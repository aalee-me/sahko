import AppKit
import Foundation

struct BrowserProbe {
 static func host(bundleID: String) -> String? {
  let command: String
  switch bundleID {
  case "com.apple.Safari": command = "tell application id \"com.apple.Safari\" to get URL of front document"
  case "com.google.Chrome": command = "tell application id \"com.google.Chrome\" to get URL of active tab of front window"
  case "company.thebrowser.Browser": command = "tell application id \"company.thebrowser.Browser\" to get URL of active tab of front window"
  default: return nil
  }
  var error: NSDictionary?
  guard let script=NSAppleScript(source:command),let raw=script.executeAndReturnError(&error).stringValue,error == nil else { return nil }
  // The full URL exists only in this stack frame, never in a log or shared model.
  return URLComponents(string:raw)?.host?.lowercased()
 }
 static func spotifyPlaying() -> Bool {
  guard NSWorkspace.shared.runningApplications.contains(where:{$0.bundleIdentifier == "com.spotify.client"}) else { return false }
  var error: NSDictionary?
  let result=NSAppleScript(source:"tell application id \"com.spotify.client\" to get player state as string")?.executeAndReturnError(&error).stringValue
  return error == nil && result == "playing"
 }
 static func appleMusicPlaying() -> Bool {
  guard NSWorkspace.shared.runningApplications.contains(where:{$0.bundleIdentifier == "com.apple.Music"}) else {return false}
  var error:NSDictionary?
  let result=NSAppleScript(source:"tell application id \"com.apple.Music\" to get player state as string")?.executeAndReturnError(&error).stringValue
  return error == nil && result == "playing"
 }

}
