package io.fishjam.reactnative.foreground

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.Build
import android.os.IBinder
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.CodedException
import io.fishjam.reactnative.FishjamForegroundService
import io.fishjam.reactnative.ForegroundServiceConfig

class ForegroundServiceManager(
  private val appContext: AppContext,
  private val onServiceConnected: () -> Unit
) {
  private lateinit var serviceInstance: FishjamForegroundService

  var isServiceBound: Boolean = false
    private set

  var latestConfig: ForegroundServiceConfig? = null
    private set

  private val serviceIntent = Intent(
    appContext.reactContext, FishjamForegroundService::class.java
  )

  private val connection = object : ServiceConnection {
    override fun onServiceConnected(className: ComponentName, service: IBinder) {
      val binder = service as FishjamForegroundService.LocalBinder
      serviceInstance = binder.getService()
      isServiceBound = true
      onServiceConnected()
    }

    override fun onServiceDisconnected(arg0: ComponentName) {
      isServiceBound = false
    }
  }

  fun startForegroundService(config: ForegroundServiceConfig) {
    if (appContext.reactContext == null) {
      throw CodedException(message = "reactContext not found")
    }

    val channelId =
      config.channelId
        ?: throw CodedException(message = "Missing `channelId` for startForegroundService")
    val channelName =
      config.channelName
        ?: throw CodedException(message = "Missing `channelName` for startForegroundService")
    val notificationContent =
      config.notificationContent
        ?: throw CodedException(message = "Missing `notificationContent` for startForegroundService")
    val notificationTitle =
      config.notificationTitle
        ?: throw CodedException(message = "Missing `notificationTitle` for startForegroundService")
    val foregroundServiceTypes = config.foregroundServiceTypes

    latestConfig = config

    // If no service type was passed, we only need to save the latest config for later use.
    if (foregroundServiceTypes.isEmpty()) {
      return
    }

    if (!isServiceBound) {
      appContext.currentActivity!!.bindService(serviceIntent, connection, Context.BIND_AUTO_CREATE)
    }

    serviceIntent.putExtra("channelId", channelId)
    serviceIntent.putExtra("channelName", channelName)
    serviceIntent.putExtra("notificationTitle", notificationContent)
    serviceIntent.putExtra("notificationContent", notificationTitle)
    serviceIntent.putExtra("foregroundServiceTypes", foregroundServiceTypes)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      appContext.reactContext!!.startForegroundService(serviceIntent)
    } else {
      appContext.reactContext!!.startService(serviceIntent)
    }
  }

  fun stopForegroundService() {
    if (appContext.reactContext == null) {
      throw CodedException(message = "reactContext not found")
    }

    if (isServiceBound) {
      isServiceBound = false
      appContext.currentActivity!!.unbindService(connection)
    }
    latestConfig = null
    appContext.reactContext!!.stopService(serviceIntent)
  }
}
