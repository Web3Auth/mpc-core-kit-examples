

package com.example.androidsfaexample

// IMP START - Auth Provider Login
// IMP END - Auth Provider Login
// IMP START - Quick Start
// IMP END - Quick Start
import android.content.ContentValues.TAG
import android.content.Context
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.auth0.android.jwt.JWT
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.ktx.auth
import com.google.firebase.ktx.Firebase
import com.google.gson.Gson
import com.google.gson.JsonArray
import com.web3auth.core.Web3Auth
import com.web3auth.core.types.AuthConnection
import com.web3auth.core.types.BuildEnv
import com.web3auth.core.types.LoginParams
import com.web3auth.core.types.Web3AuthOptions
import com.web3auth.core.types.Web3AuthResponse
import org.torusresearch.fetchnodedetails.types.Web3AuthNetwork
import org.torusresearch.torusutils.types.SessionData
import java.util.concurrent.CompletableFuture
import java.util.concurrent.ExecutionException

class MainActivity : AppCompatActivity() {
    private lateinit var web3AuthOptions: Web3AuthOptions
    private lateinit var loginParams: LoginParams
    private var torusKey: String? = null
    private var sessionData: SessionData? = null
    private lateinit var web3Auth: Web3Auth

    // IMP START - Auth Provider Login
    private lateinit var auth: FirebaseAuth
    // IMP END - Auth Provider Login
    private var publicAddress: String = ""
    private val gson = Gson()


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        // IMP START - Initialize Web3Auth SFA
        web3AuthOptions = Web3AuthOptions(
            clientId = "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ",
            web3AuthNetwork = Web3AuthNetwork.SAPPHIRE_MAINNET,
            authBuildEnv = BuildEnv.TESTING,
            defaultChainId = "0x1",
            redirectUrl = "w3a://com.example.androidsfaexample"
        )

        val context: Context = this.applicationContext
        web3Auth = Web3Auth(
            web3AuthOptions, this
        )
        // IMP END - Initialize Web3Auth SFA


        // Setup UI and event handlers
        val signInButton = findViewById<Button>(R.id.signIn)
        signInButton.setOnClickListener { signIn() }

        val signOutButton = findViewById<Button>(R.id.signOut)
        signOutButton.setOnClickListener { signOut(this.applicationContext) }

        val requestButton = findViewById<Button>(R.id.requestButton)
        requestButton.setOnClickListener { requestMethod() }

        val showWalletUIButton = findViewById<Button>(R.id.showWalletUI)
        showWalletUIButton.setOnClickListener { showWalletUI() }
        val torusKeyCF = web3Auth.initialize()
        torusKeyCF.whenComplete { _, error ->
            if (error != null) {
                Log.e("Initialize Error", error.toString())
            } else {
                reRender()
                Log.i("PrivKey: ", web3Auth.getPrivateKey())
                Log.i("Web3Auth UserInfo", web3Auth.getUserInfo().toString())
            }
        }
        //Log.i("Is connected",singleFactorAuth.isConnected().toString())

        reRender()
    }

    private fun requestMethod() {
        val credentials: org.web3j.crypto.Credentials =
            org.web3j.crypto.Credentials.create(web3Auth.getPrivateKey())
        val params = JsonArray().apply {
            add("Hello, World!")
            add(credentials.address)
        }

        val signMsgCompletableFuture = web3Auth.request("personal_sign", requestParams = params)

        signMsgCompletableFuture.whenComplete { signResult, error ->
            if (error == null) {
                Log.d("Sign Result", signResult.toString())

            } else {
                Log.d("Sign Error", error.message ?: "Something went wrong")
            }
        }
    }

    private fun showWalletUI() {

        val launchWalletCompletableFuture = web3Auth.showWalletUI()
        launchWalletCompletableFuture.whenComplete { _, error ->
            if (error == null) {
                Log.d("MainActivity_Web3Auth", "Wallet launched successfully")
            } else {
                Log.d("MainActivity_Web3Auth", error.message ?: "Something went wrong")
            }
        }
    }

    private fun signIn(){
        // Initialize Firebase Auth
        // IMP START - Auth Provider Login
        auth = Firebase.auth
        auth.signInWithEmailAndPassword("android@firebase.com", "Android@Web3Auth")
            .addOnCompleteListener(this) { task ->
                if (task.isSuccessful) {
                    // Sign in success, update UI with the signed-in user's information
                    Log.d(TAG, "signInWithEmail:success")
                    val user = auth.currentUser
                    user!!.getIdToken(true).addOnSuccessListener { result ->
                        val idToken = result.token
                        // IMP END - Auth Provider Login
                        //Do whatever
                        Log.d(TAG, "GetTokenResult result = $idToken")
                        if (idToken != null) {
                            val jwt = JWT(idToken)
                            val issuer = jwt.issuer //get registered claims
                            Log.d(TAG, "Issuer = $issuer")
                            val sub = jwt.getClaim("sub").asString() //get sub claims
                            Log.d(TAG, "sub = $sub")
                            // IMP START - Verifier Creation

                            loginParams =
                                LoginParams(
                                    authConnection = AuthConnection.GOOGLE,
                                    authConnectionId = "w3a-firebase-demo",
                                    idToken = "$idToken"
                                )
                            val loginCompletableFuture: CompletableFuture<Web3AuthResponse> =
                                web3Auth.connectTo(
                                    loginParams, ctx = this
                                )
                            // IMP END - Verifier Creation
                            try {
                                // IMP START - Get Key
                                loginCompletableFuture.whenComplete { _, error ->
                                    if (error == null) {
                                        Log.i("PrivKey: ", web3Auth.getPrivateKey())
                                        Log.i(
                                            "Web3Auth UserInfo",
                                            web3Auth.getUserInfo().toString()
                                        )
                                        reRender()
                                    } else {
                                        Log.d(
                                            "MainActivity_Web3Auth",
                                            error.message ?: "Something went wrong"
                                        )
                                    }
                                }
                                // IMP END - Get Key
                            } catch (e: ExecutionException) {
                                e.printStackTrace()
                            } catch (e: InterruptedException) {
                                e.printStackTrace()
                            }
                            //Log.i("Private Key:", torusKey!!.trimIndent())
                            //Log.i("Public Address:", publicAddress.trimIndent())
                            //Log.i("User Info", sessionData!!.userInfo.toString())
                            //println(sessionData!!.signatures)
                            //reRender()
                        }
                    }
                } else {
                    // If sign in fails, display a message to the user.
                    Log.w(TAG, "signInWithEmail:failure", task.exception)
                    Toast.makeText(
                        baseContext, "Authentication failed.",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
    }

    private fun signOut(context: Context) {
        publicAddress = ""
        Firebase.auth.signOut()
        try {
            val logoutCF = web3Auth.logout()
            logoutCF.whenComplete { t, u ->
                reRender()
            }
            //logoutCF.get()
            //reRender()
        } catch (error: Exception) {
            Log.e("Logout Error", error.toString());
        }
    }

    private fun reRender() {
        val contentTextView = findViewById<TextView>(R.id.contentTextView)
        val signInButton = findViewById<Button>(R.id.signIn)
        val signOutButton = findViewById<Button>(R.id.signOut)
        val showWalletUIButton = findViewById<Button>(R.id.showWalletUI)
        val requestButton = findViewById<Button>(R.id.requestButton)

        if (web3Auth.getPrivateKey().isNotEmpty()) {
            contentTextView.text = gson.toJson(publicAddress)
            contentTextView.visibility = View.VISIBLE
            signInButton.visibility = View.GONE
            signOutButton.visibility = View.VISIBLE
            showWalletUIButton.visibility = View.VISIBLE
            requestButton.visibility = View.VISIBLE
        } else {
            contentTextView.visibility = View.GONE
            signInButton.visibility = View.VISIBLE
            signOutButton.visibility = View.GONE
            showWalletUIButton.visibility = View.GONE
            requestButton.visibility = View.GONE
        }
    }
}
