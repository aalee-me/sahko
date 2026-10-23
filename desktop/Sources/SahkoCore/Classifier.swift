import Foundation

public enum FocusState: String, Codable { case focused, resting, drifting }
public struct Classification: Equatable {
 public let state: FocusState
 public let reason: String
 public let vibe: String?
 public init(_ state: FocusState, _ reason: String, _ vibe: String? = nil) { self.state = state; self.reason = reason; self.vibe = vibe }
}
public struct Policy: Codable {
 public var deepWork = ["Figma", "Visual Studio Code", "Code", "Cursor", "Onshape", "Blender", "Notion", "Preview", "Terminal", "iTerm2", "Sähkö"]
 public var neutral = ["Google Chrome", "Safari", "Arc", "Spotify", "Slack", "Discord"]
 public var distracting = [String]()
 public var offTaskHosts = ["instagram.com", "tiktok.com", "x.com", "reddit.com"]
 public var graceSeconds: Double = 120
 public var offTaskSeconds: Double = 90
 public var idleSeconds: Double = 180
 public init() {}
}
public struct Observation {
 public var app: String
 public var host: String?
 public var idle: Double
 public var audioContext: Bool
 public var onBreak: Bool
 public init(app: String, host: String? = nil, idle: Double = 0, audioContext: Bool = false, onBreak: Bool = false) { self.app = app; self.host = host; self.idle = idle; self.audioContext = audioContext; self.onBreak = onBreak }
}
public struct Classifier {
 private var lastDeep: Double?
 private var offTaskSince: Double?
 public init() {}
 public mutating func reset() { lastDeep = nil; offTaskSince = nil }
 public mutating func classify(_ input: Observation, policy: Policy, now: Double) -> Classification {
  func contains(_ list: [String], _ value: String) -> Bool { list.contains { $0.caseInsensitiveCompare(value) == .orderedSame } }
  if input.onBreak { offTaskSince = nil; return Classification(.resting, "On a break") }
  // Audio and deep-work buckets never override prolonged inactivity.
  if input.idle >= policy.idleSeconds { offTaskSince = nil; return Classification(.drifting, "No recent activity · check in if you’re reading") }
  let blockedHost = input.host.map { host in policy.offTaskHosts.contains { host == $0 || host.hasSuffix("." + $0) } } ?? false
  let offTask = blockedHost || contains(policy.distracting, input.app)
  if offTask {
   if offTaskSince == nil { offTaskSince = now }
   if now - (offTaskSince ?? now) >= policy.offTaskSeconds { return Classification(.drifting, "Off-task context for more than 90 seconds") }
   return Classification(.focused, "Context grace · brief switches are fine")
  }
  offTaskSince = nil
  if contains(policy.deepWork, input.app) {
   lastDeep = now
   let labels = ["figma":"Figma", "code":"VS Code", "visual studio code":"VS Code", "cursor":"Cursor", "blender":"Blender", "notion":"Notion", "preview":"Reading", "onshape":"Onshape", "terminal":"Terminal", "iterm2":"Terminal"]
   return Classification(.focused, "Deep work · activity is recent", labels[input.app.lowercased()] ?? "Deep work")
  }
  if input.audioContext { return Classification(.focused, "Background audio exemption", "Now Playing") }
  if let deep = lastDeep, now - deep <= policy.graceSeconds { return Classification(.focused, "Two-minute reference grace period") }
  // We cannot infer a video’s educational intent from an app name. Unclassified
  // references stay neutral; only configured off-task contexts or idle time drift.
  return Classification(.focused, contains(policy.neutral, input.app) ? "Neutral/reference app" : "Unclassified app · customize its bucket")
 }
}
public struct SharedMember: Codable {
 public var id: String; public var name: String; public var initial: String; public var state: FocusState; public var isSelf: Bool
 public init(id: String, name: String, initial: String, state: FocusState, isSelf: Bool = false) { self.id=id;self.name=name;self.initial=initial;self.state=state;self.isSelf=isSelf }
}
// This is the complete network payload. There are deliberately no window-title,
// URL, browsing-history, keystroke or raw-application-name fields.
public struct SharedSnapshot: Codable {
 public var state: FocusState = .focused
 public var vibe: String? = nil
 public var roomTitle: String = "Your orbit"
 public var roomCode: String = ""
 public var members: [SharedMember] = []
 public var remaining: Int = 1500
 public var block: Int = 1
 public var blocks: Int = 1
 public var onBreak: Bool = false
 public var paused: Bool = true
 public var progress: Double = 0
 public init() {}
}
