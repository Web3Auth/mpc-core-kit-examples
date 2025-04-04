# Keep the plugin class and its methods
-keep class com.web3auth.singlefactorauth.** { *; }
-keep class com.web3auth.single_factor_auth_flutter.types.** { *; }
-keep class com.web3auth.** { *; }
-keep class com.web3auth.singlefactorauth.types.** { *; }

# Keep all classes from both SDKs
-keep class com.web3auth.single_factor_auth_flutter.** { *; }

# Optionally, prevent warning messages for both SDKs
-dontwarn com.web3auth.singlefactorauth.**
-dontwarn com.web3auth.single_factor_auth_flutter.**

# Prevent obfuscation of anything related to get_it package (Dart side communication)
-keep class com.get_it.** { *; }

# General rules to keep Flutter classes unmarshalled correctly
-keep class io.flutter.plugins.** { *; }
-keep class io.flutter.app.** { *; }
-keep class io.flutter.embedding.** { *; }

# Keep Gson data classes if you are using Gson
-keepattributes Signature, RuntimeVisibleAnnotations
-keep class com.google.gson.** { *; }

# Keep Gson serialized classes (prevents issues with reflection-based deserialization)
-keep class com.google.gson.** { *; }
-keepattributes *Annotation*

-keep class org.torusresearch.fetchnodedetails.types.** { *; }
-keepclassmembers enum * { *; }
-printmapping mapping.txt

# Keep the client app's specific classes (if any interact directly with UserInfo)
-keep class com.example.sfa_flutter_quick_start.** { *; }

# Importantly, keep the UserInfo class as the client app uses it
-keep class com.web3auth.singlefactorauth.types.UserInfo { *; }

# Keep the LoginType enum
-keep enum com.web3auth.singlefactorauth.types.LoginType { *; }

# Keep the TorusGenericContainer class
-keep class com.web3auth.singlefactorauth.types.TorusGenericContainer { *; }

# Keep Gson (as the client app likely uses it for JSON handling related to UserInfo)
-keep class com.google.gson.** { *; }
-keepnames class com.google.gson.** { *; }
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses