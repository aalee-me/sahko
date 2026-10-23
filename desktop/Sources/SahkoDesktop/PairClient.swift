import Foundation
import Security
import SahkoCore

struct PairCredentials: Codable { let id: String; let writerToken: String }
struct PairCreated: Decodable { let id: String; let writerToken: String; let joinCode: String }
struct NewCode: Decodable { let joinCode: String }
struct PairJolt: Decodable { let id: String; let target: String; let at: Double }
struct PairRead: Decodable { let online: Bool; let jolt: PairJolt? }
struct PairWrite: Encodable { let snapshot: SharedSnapshot; let ackJolt: String? }
struct PairService {
 static let endpoint = URL(string:"https://sahko-focus-studio.sleeksmile12.chatgpt.site/api/companion/pairs")!
 static func request<T:Decodable>(_ suffix: String = "", method: String = "GET", token: String? = nil, body: Data? = nil, as: T.Type) async throws -> T {
  let url=URL(string:endpoint.absoluteString+suffix)!
  var request=URLRequest(url:url);request.httpMethod=method;request.httpBody=body;request.timeoutInterval=15;request.setValue("application/json",forHTTPHeaderField:"Content-Type");if let token=token {request.setValue("Bearer "+token,forHTTPHeaderField:"Authorization")}
  let (data,response)=try await URLSession.shared.data(for:request)
  guard let http=response as? HTTPURLResponse,(200..<300).contains(http.statusCode) else {throw NSError(domain:"Sähkö pairing",code:(response as? HTTPURLResponse)?.statusCode ?? 0,userInfo:[NSLocalizedDescriptionKey:"Couldn’t reach the pairing service. Check your connection or create a new pairing."])}
  return try JSONDecoder().decode(T.self,from:data)
 }
 static func create() async throws -> PairCreated { try await request(method:"POST",body:Data("{}".utf8),as:PairCreated.self) }
 static func code(_ c:PairCredentials) async throws -> String { try await request("/"+c.id+"/code",method:"POST",token:c.writerToken,body:Data("{}".utf8),as:NewCode.self).joinCode }
 static func publish(_ c:PairCredentials, snapshot:SharedSnapshot, ack:String?) async throws { struct OK:Decodable {let ok:Bool};let data=try JSONEncoder().encode(PairWrite(snapshot:snapshot,ackJolt:ack));let _=try await request("/"+c.id+"/state",method:"PUT",token:c.writerToken,body:data,as:OK.self) }
 static func read(_ c:PairCredentials) async throws -> PairRead {try await request("/"+c.id+"/state",token:c.writerToken,as:PairRead.self)}
 static func revoke(_ c:PairCredentials) async throws { struct OK:Decodable {let ok:Bool};let _=try await request("/"+c.id,method:"DELETE",token:c.writerToken,as:OK.self) }
}
struct PairKeychain {
 static func save(_ value:PairCredentials?) {
  let query:[String:Any]=[kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:"org.sahko.desktop.pair",kSecAttrAccount as String:"writer"]
  SecItemDelete(query as CFDictionary)
  if let value=value,let data=try? JSONEncoder().encode(value){var item=query;item[kSecValueData as String]=data;item[kSecAttrAccessible as String]=kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly;SecItemAdd(item as CFDictionary,nil)}
 }
 static func load()->PairCredentials?{let query:[String:Any]=[kSecClass as String:kSecClassGenericPassword,kSecAttrService as String:"org.sahko.desktop.pair",kSecAttrAccount as String:"writer",kSecReturnData as String:true,kSecMatchLimit as String:kSecMatchLimitOne];var item:CFTypeRef?;guard SecItemCopyMatching(query as CFDictionary,&item)==errSecSuccess,let data=item as? Data else{return nil};return try? JSONDecoder().decode(PairCredentials.self,from:data)}
}
