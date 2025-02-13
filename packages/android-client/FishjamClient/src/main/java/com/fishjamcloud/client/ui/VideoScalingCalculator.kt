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

        val (scaledWidth, scaledHeight) = when (scalingType) {
            ScalingType.SCALE_ASPECT_FILL -> calculateAspectFill(
                viewWidth.toFloat(), viewHeight.toFloat(),
                rotatedFrameWidth, rotatedFrameHeight,
                layoutAspectRatio
            )
            ScalingType.SCALE_ASPECT_FIT -> calculateAspectFit(
                viewWidth.toFloat(), viewHeight.toFloat(),
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
        viewWidth: Float, viewHeight: Float,
        rotatedFrameWidth: Int, rotatedFrameHeight: Int,
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
        return if (frameAspectRatio > viewWidth / viewHeight) {
            Pair(viewWidth, viewWidth / frameAspectRatio)
        } else {
            Pair(viewHeight * frameAspectRatio, viewHeight)
        }
    }

    private fun calculateTransformMatrix(
        scaledWidth: Int,
        scaledHeight: Int,
        viewWidth: Int,
        viewHeight: Int,
    ): Matrix {
        // Center the view along the x axis.
        val xOffset = (viewWidth / 2) - (scaledWidth / 2)
       // We always fill the full height, so start at 0
        val yOffset = 0

        return Matrix().apply {
            postScale(
                scaledWidth.toFloat() / viewWidth,
                scaledHeight.toFloat() / viewHeight
            )

            postTranslate(
              xOffset.toFloat(),
              yOffset.toFloat(),
            )
        }
    }
}
