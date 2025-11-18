package __PACKAGE__.craveoff

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class CraveOffProtectionPackage : ReactPackage {
	override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
		return listOf(CraveOffProtectionModule(reactContext))
	}

	override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
		return emptyList()
	}
}


