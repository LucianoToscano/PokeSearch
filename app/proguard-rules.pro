# R8 v0.51: preserve Android entry points and JS bridge names.
-keep class com.lucianotoscano.pokesearchoverlay.MainActivity { *; }
-keep class com.lucianotoscano.pokesearchoverlay.OverlayService { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
-keep class org.json.** { *; }
-allowaccessmodification
-repackageclasses ''
# Do not suppress all warnings: missing dependencies should fail CI.
