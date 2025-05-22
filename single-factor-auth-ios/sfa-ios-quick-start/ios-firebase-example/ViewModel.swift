import Foundation
// IMP START - Quick Start
import SingleFactorAuth
// IMP END - Quick Start
// IMP START - Auth Provider Login
import FirebaseCore
import FirebaseAuth
// IMP END - Auth Provider Login

class ViewModel: ObservableObject {
    // IMP START - Installation
    var singleFactorAuth: SingleFactorAuth!
    var web3AuthOptions: Web3AuthOptions!
    var ethereumClient: EthereumClient!
    var userBalance: String!
    
    // IMP END - Installation
    @Published var loggedIn: Bool = false
    @Published var user: String = ""
    @Published var isLoading = false
    @Published var navigationTitle: String = ""
    @Published var isAccountReady: Bool = false
    
    
    func setup() async {
        guard singleFactorAuth == nil else { return }
        await MainActor.run(body: {
            isLoading = true
            navigationTitle = "Loading"
        })
        
        // IMP START - Initialize Web3Auth SFA
        web3AuthOptions = Web3AuthOptions(
            clientId: "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ",
            web3AuthNetwork: .SAPPHIRE_MAINNET
        )
        
        singleFactorAuth = try! SingleFactorAuth(params: web3AuthOptions)
        
        do {
            try await singleFactorAuth.initialize()
        } catch let error {
            // Handle Error
            print(error)
        }
        
        // Check for existing session
        if(singleFactorAuth.getSessionData() != nil) {
            let sessionData = singleFactorAuth.getSessionData()!
            ethereumClient = EthereumClient(sessionData: sessionData)
            getBalance()
            
            await MainActor.run(body: {
                user = sessionData.getPrivateKey()
                loggedIn = true
                navigationTitle = "UserInfo"
            })
        }
        
        await MainActor.run(body: {
            isLoading = false
            navigationTitle = loggedIn ? "UserInfo" : "iOS SFA QuickStart"
        })
    }
    
    func loginViaFirebaseEP() {
        Task{
            do {
                // IMP START - Auth Provider Login
                let res = try await Auth.auth().signIn(withEmail: "ios@firebase.com", password: "iOS@Web3Auth")
                let id_token = try await res.user.getIDToken()
                // IMP END - Auth Provider Login
                
                // IMP START - Verifier Creation
                let verifierName = "w3a-firebase-demo"
                // IMP END - Verifier Creation
                // IMP START - Get Key
                let result = try await singleFactorAuth.connect(
                    loginParams: .init(
                        verifier: verifierName,
                        verifierId: res.user.uid,
                        idToken: id_token
                    )
                )
                // IMP END - Get Key
                print(result)
                ethereumClient = EthereumClient(sessionData: result)
                getBalance()
                
                await MainActor.run(body: {
                    user = result.getPrivateKey()
                    loggedIn = true
                    navigationTitle = "UserInfo"
                })
                
            } catch {
                print("Error")
            }
        }
    }
    
    func getBalance() {
        Task {
            do  {
                self.userBalance = try await ethereumClient.getBalance()
                await MainActor.run(body: {
                    self.isAccountReady = true
                })
            } catch let error {
                print(error)
                await MainActor.run(body: {
                    self.isAccountReady = true
                })
            }
        }
    }
    
    func logout() {
        Task {
            do  {
                try await singleFactorAuth.logout()
                await MainActor.run(body: {
                    self.loggedIn = false
                })
            } catch let error {
                print(error)
            }
        }
    }
    
    func signMessage(onSigned: @escaping (_ signedMessage: String?, _ error: String?) -> ()){
        Task {
            do {
                let signature = try ethereumClient.signMessage()
                onSigned(signature, nil)
            } catch let error  {
                onSigned(nil, error.localizedDescription)
            }
        }
    }
    
    
}

extension ViewModel {
    func showResult(result: SessionData) {
        print("""
        Signed in successfully!
            Private key: \(result.getPrivateKey())
            Public Address:
                Name: \(result.getPublicAddress())
        """)
    }
}
