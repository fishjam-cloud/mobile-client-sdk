package com.fishjamcloud.client.ui

import android.graphics.Matrix
import org.webrtc.RendererCommon.ScalingType
import kotlin.math.ceil
import kotlin.math.roundToInt

data class ScalingResult(
  val surfaceWidth: Int,
  val surfaceHeight: Int,
  val transform: Matrix
)

class VideoScalingCalculator {
  fun calculateScaling(
    viewWidth: Int,
    viewHeight: Int,
    rotatedFrameWidth: Int,
    rotatedFrameHeight: Int,
    scalingType: ScalingType?
  ): ScalingResult {
    if (rotatedFrameWidth == 0 || rotatedFrameHeight == 0 || viewWidth == 0 || viewHeight == 0) {
      return ScalingResult(0, 0, Matrix())
    }

    val layoutAspectRatio = viewWidth / viewHeight.toFloat()
    val frameAspectRatio = rotatedFrameWidth / rotatedFrameHeight.toFloat()

    val (scaledWidth, scaledHeight) =
      when (scalingType) {
        ScalingType.SCALE_ASPECT_FILL ->
          calculateAspectFill(
            viewWidth.toFloat(),
            viewHeight.toFloat(),
            rotatedFrameWidth,
            rotatedFrameHeight,
            layoutAspectRatio
          )
        ScalingType.SCALE_ASPECT_FIT ->
          calculateAspectFit(
            viewWidth.toFloat(),
            viewHeight.toFloat(),
            frameAspectRatio
          )
        else -> Pair(rotatedFrameWidth.toFloat(), rotatedFrameHeight.toFloat())
      }

    val finalWidth = ceil(scaledWidth).roundToInt()
    val finalHeight = ceil(scaledHeight).roundToInt()

    return ScalingResult(
      surfaceWidth = finalWidth,
      surfaceHeight = finalHeight,
      transform = calculateTransformMatrix(finalWidth, finalHeight, viewWidth, viewHeight)
    )
  }

  private fun calculateAspectFill(
    viewWidth: Float,
    viewHeight: Float,
    rotatedFrameWidth: Int,
    rotatedFrameHeight: Int,
    layoutAspectRatio: Float
  ): Pair<Float, Float> {
    val drawnFrameWidth: Float
    val drawnFrameHeight: Float

    if (rotatedFrameWidth / rotatedFrameHeight.toFloat() > layoutAspectRatio) {
      drawnFrameWidth = rotatedFrameHeight * layoutAspectRatio
      drawnFrameHeight = rotatedFrameHeight.toFloat()
    } else {
      drawnFrameWidth = rotatedFrameWidth.toFloat()
      drawnFrameHeight = rotatedFrameWidth / layoutAspectRatio
    }

    return Pair(
      minOf(viewWidth, drawnFrameWidth),
      minOf(viewHeight, drawnFrameHeight)
    )
  }

  private fun calculateAspectFit(
    viewWidth: Float,
    viewHeight: Float,
    frameAspectRatio: Float
  ): Pair<Float, Float> {
    // These are floats so we need to round them up to compare
    val viewAspectRatio = (viewWidth / viewHeight).roundTo2DecimalPlaces()
    val roundedFrameAspectRatio = frameAspectRatio.roundTo2DecimalPlaces()

    return if (roundedFrameAspectRatio > viewAspectRatio) {
      Pair(viewWidth, (viewWidth / roundedFrameAspectRatio))
    } else {
      Pair((viewHeight * roundedFrameAspectRatio), viewHeight)
    }
  }

  private fun calculateTransformMatrix(
    scaledWidth: Int,
    scaledHeight: Int,
    viewWidth: Int,
    viewHeight: Int
  ): Matrix {
    // Center along whichever axis has leftover space
    val xOffset = if (scaledWidth < viewWidth) (viewWidth / 2) - (scaledWidth / 2) else 0
    val yOffset = if (scaledHeight < viewHeight) (viewHeight / 2) - (scaledHeight / 2) else 0

    return Matrix().apply {
      postScale(
        scaledWidth.toFloat() / viewWidth,
        scaledHeight.toFloat() / viewHeight
      )

      postTranslate(
        xOffset.toFloat(),
        yOffset.toFloat()
      )
    }
  }

  private fun Float.roundTo2DecimalPlaces(): Float = (this * 100).toInt() / 100f
}
