import 'dart:developer';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:single_factor_auth_flutter/enums.dart';
import 'package:single_factor_auth_flutter/input.dart';
import 'package:single_factor_auth_flutter/output.dart';
// IMP START - Quick Start
import 'package:single_factor_auth_flutter/single_factor_auth_flutter.dart';

// IMP END - Quick Start
class Web3AuthSFA {
  final SingleFactorAuthFlutter singleFactorAuthFlutter;

  Web3AuthSFA(this.singleFactorAuthFlutter);

  Future<void> init() async {
    // IMP START - Initialize Web3Auth SFA
    await singleFactorAuthFlutter.init(
      Web3AuthOptions(
        network: Web3AuthNetwork.sapphire_mainnet,
        clientId:
            "BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ",
        redirectUrl: 'com.example.sfa_flutter_quick_start',
      ),
    );
    // IMP END - Initialize Web3Auth SFA
  }

  Future<void> initialize() async {
    try {
      await singleFactorAuthFlutter.initialize();
      final sessionData = await singleFactorAuthFlutter.getSessionData();
      if (sessionData != null) {
        log('Initialized successfully. Private Key: ${sessionData.privateKey}');
      }
    } catch (e) {
      log("Error initializing SFA: $e");
    }
  }

  Future<void> connected() async {
    try {
      final isConnected = await singleFactorAuthFlutter.connected();
      forceLog('isConnected: $isConnected');
      final isConnected_1 = await singleFactorAuthFlutter.connected();
      forceLog('isConnected_1: $isConnected_1');
    } catch (e) {
      forceLog("Error connecting SFA: $e");
    }
  }

  Future<void> getSessionData() async {
    try {
      final sessionData = await singleFactorAuthFlutter.getSessionData();
      forceLog('SessionData: $sessionData');
    } catch (e) {
      forceLog("Error connecting SFA: $e");
    }
  }

  void forceLog(String message) {
    print('[SDK LOG] $message');
  }

  Future<void> showWalletUI() async {
    try {
      final chainConfig = ChainConfig(
        chainId: '0xaa36a7',
        rpcTarget: 'https://1rpc.io/sepolia',
      );
      await singleFactorAuthFlutter.showWalletUI(chainConfig);
    } catch (e) {
      log("Error showing wallet UI: $e");
    }
  }

  Future<void> showTransactionUI() async {
    try {
      final chainConfig = ChainConfig(
        chainId: '0xaa36a7',
        rpcTarget: 'https://1rpc.io/sepolia',
      );

      final sessionData = await singleFactorAuthFlutter.getSessionData();
      final result =
          await singleFactorAuthFlutter.request(chainConfig, "personal_sign", [
        "Hello, Web3Auth from Flutter SFA!",
        sessionData!.publicAddress,
      ]);

      log("Transaction result: $result");
    } catch (e) {
      log("Error showing wallet UI: $e");
    }
  }

  Future<SessionData> getKey(User user) async {
    // IMP START - Get Key
    try {
      final token = await user.getIdToken(true);
      final SessionData sessionData = await singleFactorAuthFlutter.connect(
        LoginParams(
          // IMP START - Verifier Creation
          verifier: 'w3a-firebase-demo',
          // IMP END - Verifier Creation
          verifierId: user.uid,
          idToken: token!,
        ),
      );

      return sessionData;
    } catch (e) {
      rethrow;
    }
    // IMP END - Get Key
  }
}
