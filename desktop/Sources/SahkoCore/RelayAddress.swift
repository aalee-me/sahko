import Foundation

public enum RelayAddress {
 public static func localOrigin(_ text:String)->URL? {
  guard let url=URL(string:text.trimmingCharacters(in:.whitespacesAndNewlines)),url.scheme=="https",url.user==nil,url.password==nil,url.query==nil,url.fragment==nil,(url.path.isEmpty || url.path=="/"),let host=url.host else{return nil}
  let labels=host.split(separator:"."),parts=labels.compactMap{Int($0)},ipv4=labels.count==4 && parts.count==4 && parts.allSatisfy{(0...255).contains($0)}
  let local=host=="localhost" || host.hasSuffix(".local") || (ipv4 && (parts[0]==10 || parts[0]==127 || (parts[0]==192 && parts[1]==168) || (parts[0]==172 && (16...31).contains(parts[1]))))
  guard local else{return nil};return URL(string:"https://"+host+(url.port.map{":"+String($0)} ?? ""))
 }
}
