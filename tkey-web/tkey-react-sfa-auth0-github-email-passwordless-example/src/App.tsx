/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import "./App.css";
import { CustomFactorsModuleType } from "./constants";
import swal from "sweetalert";
import { ethereumPrivateKeyProvider, tKey } from "./tkey";
import Web3 from "web3";
import SfaServiceProvider from "@tkey/service-provider-sfa";
import { WebStorageModule } from "@tkey/web-storage";
import { auth } from "./FireBaseConfig";
import { TorusServiceProvider } from "@tkey/service-provider-torus";

import BN from "bn.js";

import { useAuth0 } from "@auth0/auth0-react";
import { signInWithEmailLink, isSignInWithEmailLink, sendSignInLinkToEmail } from "firebase/auth";
export const wcVerifier = "wallet-connect-test";
export const BACKEND_URL = "https://wc-admin.web3auth.com";
function App() {
  const [user, setUser] = useState<any>(null);
  const [privateKey, setPrivateKey] = useState<any>();
  const [oAuthShare, setOAuthShare] = useState<any>();
  const [provider, setProvider] = useState<any>();
  const [idToken, setIdToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("hello@web3auth.io");
  const [emailIdToken, setEmailIdToken] = useState<string | null>(null);

  const { getIdTokenClaims, loginWithPopup } = useAuth0();
  const verifier = "w3a-auth0-github";

  // Init Service Provider inside the useEffect Method
  useEffect(() => {
    const init = async () => {
      // Initialization of Service Provider
      try {
        await (tKey.serviceProvider as any).init(ethereumPrivateKeyProvider);
      } catch (error) {
        console.error(error);
      }
    };
    init();
    const ethProvider = async () => {
      /*
			pass user's private key here.
			after calling setupProvider, we can use
			*/
      if (privateKey) {
        await ethereumPrivateKeyProvider.setupProvider(privateKey);
        console.log(ethereumPrivateKeyProvider.provider);
        setProvider(ethereumPrivateKeyProvider.provider);
      }
    };
    ethProvider();
  }, [privateKey]);

  // if signed by email passwordless, then we should login again with the IdToken
  // derived from auth0

  useEffect(() => {
    (async () => {
      if (isSignInWithEmailLink(auth, window.location.href)) {
        const { sub } = parseToken(idToken!);
        setUser(sub);

        const OAuthShareKey = await (tKey.serviceProvider as SfaServiceProvider).connect({
          verifier,
          verifierId: sub,
          idToken: idToken!,
        });

        uiConsole("OAuthShareKey", OAuthShareKey);
        setOAuthShare(OAuthShareKey);

        initializeNewKey();
      }
    })();
  }, []);

  const parseToken = (token: any) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace("-", "+").replace("_", "/");
      return JSON.parse(window.atob(base64 || ""));
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const login = async () => {
    if (!tKey) {
      uiConsole("tKey not initialized yet");
      return;
    }
    try {
      await loginWithPopup();
      // get the id token from auth0
      const idToken = (await getIdTokenClaims())?.__raw.toString();
      // if idToken is null, then the user has not logged in yet
      if (!idToken) {
        return;
      }
      setIdToken(idToken);
      console.log(idToken);

      // get sub value from firebase id token
      const { sub } = parseToken(idToken);
      setUser(sub);

      const OAuthShareKey = await (tKey.serviceProvider as SfaServiceProvider).connect({
        verifier,
        verifierId: sub,
        idToken,
      });

      uiConsole("OAuthShareKey", OAuthShareKey);
      setOAuthShare(OAuthShareKey);

      // uiConsole('Public Key : ' + loginResponse.publicAddress);
      // uiConsole('Email : ' + loginResponse.userInfo.email);

      initializeNewKey();
    } catch (error) {
      console.log(error);
      uiConsole(error);
    }
  };

  const initializeNewKey = async () => {
    if (!tKey) {
      uiConsole("tKey not initialized yet");
      return;
    }
    try {
      // Initialization of tKey
      await tKey.initialize(); // 1/2 flow
      // Gets the deviceShare
      console.log(tKey);
      var { requiredShares } = tKey.getKeyDetails();

      uiConsole("requiredShares", requiredShares);
      const deviceShare = await getDeviceShare();

      if (requiredShares > 0) {
        if (deviceShare) {
          try {
            // 2/2 flow
            await (tKey.modules.webStorage as any).inputShareFromWebStorage();
          } catch (error) {
            uiConsole(error);
          }
        }
        var { requiredShares } = tKey.getKeyDetails();
        if (requiredShares > 0) {
          return;
        }
      }
      const reconstructedKey = await tKey.reconstructKey();
      setPrivateKey(reconstructedKey?.privKey.toString("hex"));
      uiConsole("Private Key: " + reconstructedKey.privKey.toString("hex"));
    } catch (error) {
      uiConsole(error, "caught");
    }
  };

  const changeSecurityQuestionAndAnswer = async () => {
    if (!tKey) {
      uiConsole("tKey not initialized yet");
      return;
    }
    // swal is just a pretty dialog box
    swal("Enter password (>10 characters)", {
      content: "input" as any,
    }).then(async (value) => {
      if (value.length > 10) {
        await (tKey.modules.securityQuestions as any).changeSecurityQuestionAndAnswer(value, "whats your password?");
        swal("Success", "Successfully changed new share with password.", "success");
        uiConsole("Successfully changed new share with password.");
      } else {
        swal("Error", "Password must be >= 11 characters", "error");
      }
    });
    const keyDetails = await tKey.getKeyDetails();
    uiConsole(keyDetails);
  };

  const generateNewShareWithPassword = async () => {
    if (!tKey) {
      uiConsole("tKey not initialized yet");
      return;
    }
    // swal is just a pretty dialog box
    swal("Enter password (>10 characters)", {
      content: "input" as any,
    }).then(async (value) => {
      if (value.length > 10) {
        try {
          await (tKey.modules.securityQuestions as any).generateNewShareWithSecurityQuestions(value, "whats your password?");
          swal("Success", "Successfully generated new share with password.", "success");
          uiConsole("Successfully generated new share with password.");
        } catch (error) {
          swal("Error", (error as any)?.message.toString(), "error");
        }
      } else {
        swal("Error", "Password must be >= 11 characters", "error");
      }
    });
  };

  const generateMnemonic = async () => {
    if (!tKey) {
      uiConsole("tKey not initialized yet");
      return;
    }
    try {
      const newShare = await tKey.generateNewShare();
      const mnemonic = await tKey.outputShare(newShare.newShareIndex, "mnemonic");
      uiConsole("Mnemonic: " + mnemonic);
    } catch (error) {
      uiConsole(error);
    }
  };

  const getDeviceShare = async () => {
    try {
      const share = await (tKey.modules.webStorage as WebStorageModule).getDeviceShare();

      if (share) {
        uiConsole("Device Share Captured Successfully across", JSON.stringify(share));
        return share;
      }
      uiConsole("Device Share Not found");
      return null;
    } catch (error) {
      uiConsole("Error", (error as any)?.message.toString(), "error");
    }
  };

  // const deleteDeviceShare = async () => {
  // 	try {
  // 	  const metadata = await tKey.getMetadata();
  // 	  await EncryptedStorage.removeItem(metadata.pubKey.x.toString('hex'));
  // 	  uiConsole('Device Share Deleted');
  // 	} catch (error) {
  // 	  uiConsole('Error', (error as any)?.message.toString(), 'error');
  // 	}
  // };

  const backupShareRecover = async () => {
    if (!tKey) {
      uiConsole("tKey not initialized yet");
      return;
    }
    // swal is just a pretty dialog box
    swal("Enter mnemonic", {
      content: "input" as any,
    }).then(async (value) => {
      try {
        await tKey.inputShare(value, "mnemonic"); // 2/2 flow
        // const { requiredShares } = tKey.getKeyDetails();
        // if (requiredShares <= 0) {
        const reconstructedKey = await tKey.reconstructKey();
        console.log(reconstructedKey);
        uiConsole("Private Key: " + reconstructedKey.privKey.toString("hex"));
        setPrivateKey(reconstructedKey?.privKey.toString("hex"));
        // }
      } catch (error) {
        uiConsole(error);
      }
    });
  };

  const recoverShare = async () => {
    if (!tKey) {
      uiConsole("tKey not initialized yet");
      return;
    }
    // swal is just a pretty dialog box
    swal("Enter password (>10 characters)", {
      content: "input" as any,
    }).then(async (value) => {
      if (value.length > 10) {
        try {
          await (tKey.modules.securityQuestions as any).inputShareFromSecurityQuestions(value); // 2/2 flow
          const { requiredShares } = tKey.getKeyDetails();
          if (requiredShares <= 0) {
            const reconstructedKey = await tKey.reconstructKey();
            setPrivateKey(reconstructedKey?.privKey.toString("hex"));
            uiConsole("Private Key: " + reconstructedKey.privKey.toString("hex"));
          }
          const newShare = await tKey.generateNewShare();
          const shareStore = await tKey.outputShareStore(newShare.newShareIndex);
          await (tKey.modules.webStorage as any).storeDeviceShare(shareStore);
          swal("Success", "Successfully logged you in with the recovery password.", "success");
          uiConsole("Successfully logged you in with the recovery password.");
        } catch (error) {
          swal("Error", (error as any)?.message.toString(), "error");
          uiConsole(error);
          logout();
        }
      } else {
        swal("Error", "Password must be >= 11 characters", "error");
        uiConsole("Looks like you entered an invalid password. Please try again via logging in or reset your account.");
      }
    });
  };
  const triggerEmailLogin = async () => {
    try {
      // Triggering Login using Service Provider ==> opens the popup
      await (tKey.serviceProvider as TorusServiceProvider).triggerLogin({
        typeOfLogin: "jwt",
        verifier: wcVerifier,
        jwtParams: {
          domain: "https://wc-auth.web3auth.com",
          verifierIdField: "name",
          connection: "email",
          login_hint: email,
        },
        clientId: "QQRQNGxJ80AZ5odiIjt1qqfryPOeDcb1",
      });
    } catch (error) {
      uiConsole(error);
    }
  };
  // const signInWithEmailPasswordless = async (): Promise<any> => {
  //   try {
  //     sendSignInLinkToEmail(auth, email, {
  //       url: window.location.href,
  //       handleCodeInApp: true,
  //     }).then(() => {
  //       uiConsole("email sent, please check your email");

  //       if (isSignInWithEmailLink(auth, window.location.href)) {
  //         const email = localStorage.getItem("email_for_web3auth_sfa_demo") || "hello@web3auth.io";
  //         signInWithEmailLink(auth, email, window.location.href)
  //           .then(async (loginRes) => {
  //             uiConsole(loginRes);
  //             const idToken = await loginRes.user.getIdToken(true);

  //             setIdToken(idToken);

  //             const OauthShareKey = await (tKey.serviceProvider as SfaServiceProvider).connect({
  //               verifier,
  //               verifierId: loginRes.user.uid,
  //               idToken: idToken,
  //             });
  //             uiConsole("OAuthShareKey", OauthShareKey);
  //             console.log("OAuthShareKey", OauthShareKey);
  //           })
  //           .catch((error) => {
  //             uiConsole(error);
  //           });
  //       }
  //     });
  //   } catch (error) {
  //     uiConsole(error);
  //   }
  // };

  // const signInWithEmailPasswordless = async (): Promise<any> => {
  //   try {
  //     // get idtoken by login
  //     // if (isSignInWithEmailLink(auth, window.location.href)) {
  //     console.log("??");

  //     const email = localStorage.getItem("email_for_web3auth_sfa_demo") || "hello@web3auth.io";
  //     signInWithEmailLink(auth, email, window.location.href).then(async (loginRes) => {
  //       uiConsole(loginRes);
  //       const idToken = await loginRes.user.getIdToken(true);

  //       setEmailIdToken(idToken);

  //       const OauthShareKey = await (tKey.serviceProvider as SfaServiceProvider).connect({
  //         verifier,
  //         verifierId: loginRes.user.uid,
  //         idToken: idToken,
  //       });
  //       uiConsole("OAuthShareKey", OauthShareKey);
  //       if (OauthShareKey) {
  //         return OauthShareKey;
  //       }
  //     });
  //     // } else {
  //     //   console.log("bb");
  //     //   console.log(email);
  //     // }
  //   } catch (error) {
  //     uiConsole(error);
  //   }
  // };

  const recoverWithEmailPasswordless = async () => {};

  // const registerEmail = async () => {
  //   const OauthShareKey = await signInWithEmailPasswordless();
  //   if (!OauthShareKey) {
  //     return;
  //   }
  //   await tKey.inputShare(OauthShareKey);
  // };

  const keyDetails = async () => {
    if (!tKey) {
      uiConsole("tKey not initialized yet");
      return;
    }
    const keyDetails = await tKey.getKeyDetails();
    uiConsole(keyDetails);
  };

  const resetAccount = async () => {
    if (!tKey) {
      uiConsole("tKey not initialized yet");
      return;
    }
    try {
      uiConsole(oAuthShare);
      await tKey.storageLayer.setMetadata({
        privKey: oAuthShare,
        input: { message: "KEY_NOT_FOUND" },
      });
      uiConsole("Reset Account Successful.");
    } catch (e) {
      uiConsole(e);
    }
  };

  const logout = (): void => {
    uiConsole("Log out");
    setUser(null);
  };

  const getIdToken = (): void => {
    uiConsole(idToken);
  };

  const getUserInfo = (): void => {
    uiConsole(user);
  };

  const getPrivateKey = (): void => {
    uiConsole(privateKey);
  };

  const getChainID = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const web3 = new Web3(provider);
    const chainId = await web3.eth.getChainId();
    uiConsole(chainId);
  };

  const getAccounts = async (): Promise<string> => {
    if (!provider) {
      console.log("provider not initialized yet");
      return ``;
    }
    const web3 = new Web3(provider);
    const address = (await web3.eth.getAccounts())[0];
    uiConsole(address);
    return address;
  };

  const getBalance = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const web3 = new Web3(provider);
    const address = (await web3.eth.getAccounts())[0];
    const balance = web3.utils.fromWei(
      await web3.eth.getBalance(address) // Balance is in wei
    );
    uiConsole(balance);
  };

  const signMessage = async (): Promise<any> => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const web3 = new Web3(provider);
    const fromAddress = (await web3.eth.getAccounts())[0];
    const originalMessage = [
      {
        type: "string",
        name: "fullName",
        value: "Satoshi Nakamoto",
      },
      {
        type: "uint32",
        name: "userId",
        value: "1212",
      },
    ];
    const params = [originalMessage, fromAddress];
    const method = "eth_signTypedData";
    const signedMessage = await (web3.currentProvider as any)?.sendAsync({
      id: 1,
      method,
      params,
      fromAddress,
    });
    uiConsole(signedMessage);
  };

  const sendTransaction = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const web3 = new Web3(provider);
    const fromAddress = (await web3.eth.getAccounts())[0];

    const destination = "0x7aFac68875d2841dc16F1730Fba43974060b907A";
    const amount = web3.utils.toWei("0.0001"); // Convert 1 ether to wei

    // Submit transaction to the blockchain and wait for it to be mined
    const receipt = await web3.eth.sendTransaction({
      from: fromAddress,
      to: destination,
      value: amount,
      maxPriorityFeePerGas: "5000000000", // Max priority fee per gas
      maxFeePerGas: "6000000000000", // Max fee per gas
    });
    uiConsole(receipt);
  };

  const uiConsole = (...args: any[]): void => {
    const el = document.querySelector("#console>p");
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
    }
    console.log(...args);
  };

  const loggedInView = (
    <>
      <div className="flex-container">
        <div>
          <button onClick={getUserInfo} className="card">
            Get User Info
          </button>
        </div>
        <div>
          <button onClick={generateNewShareWithPassword} className="card">
            Generate Password Share
          </button>
        </div>
        <div>
          <button onClick={changeSecurityQuestionAndAnswer} className="card">
            Change Password Share
          </button>
        </div>
        <div>
          <button onClick={generateMnemonic} className="card">
            Generate Backup (Mnemonic)
          </button>
        </div>
        <div>
          <button onClick={backupShareRecover} className="card">
            Input Backup Share
          </button>
        </div>
        <div>
          <button onClick={keyDetails} className="card">
            Key Details
          </button>
        </div>
        <div>
          <button onClick={getPrivateKey} className="card">
            Private Key
          </button>
        </div>
        <div>
          <button onClick={getChainID} className="card">
            Get Chain ID
          </button>
        </div>
        <div>
          <button onClick={getAccounts} className="card">
            Get Accounts
          </button>
        </div>
        <div>
          <button onClick={getBalance} className="card">
            Get Balance
          </button>
        </div>

        <div>
          <button onClick={signMessage} className="card">
            Sign Message
          </button>
        </div>
        <div>
          <button onClick={sendTransaction} className="card">
            Send Transaction
          </button>
        </div>
        <div>
          <button onClick={logout} className="card">
            Log Out
          </button>
        </div>
        <div>
          <button onClick={resetAccount} className="card">
            Reset Account (CAUTION)
          </button>
        </div>
      </div>

      <hr />
      <h4>email passwordless logic</h4>

      <p>Email:</p>
      <input
        type="text"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          localStorage.setItem("email_for_web3auth_sfa_demo", e.target.value);
        }}
      />
      <button onClick={triggerEmailLogin} className="card">
        sign in with email
      </button>

      <button onClick={recoverWithEmailPasswordless} className="card">
        recoverWithEmailPasswordless
      </button>

      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}></p>
      </div>
    </>
  );

  const unloggedInView = (
    <button onClick={login} className="card">
      Login
    </button>
  );

  return (
    <div className="container">
      <h1 className="title">
        <a target="_blank" href="http://web3auth.io/" rel="noreferrer">
          Web3Auth (tKey)
        </a>
        & Auth0 + GitHub + Email-passwordless Ethereum Example
      </h1>

      <div className="grid">{user ? loggedInView : unloggedInView}</div>

      <footer className="footer">
        <a
          href="https://github.com/Web3Auth/web3auth-core-kit-examples/tree/main/tkey/tkey-react-redirect-example"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source code
        </a>
      </footer>
    </div>
  );
}

export default App;
