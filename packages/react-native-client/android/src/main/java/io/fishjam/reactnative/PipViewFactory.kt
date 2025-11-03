package io.fishjam.reactnative

import android.content.Context
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.text.TextUtils
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.RelativeLayout
import android.widget.TextView
import expo.modules.kotlin.AppContext

data class PipViewContainer(
    val splitScreenContainer: LinearLayout,
    val primaryContainer: RelativeLayout,
    val secondaryContainer: RelativeLayout,
    val primaryVideoView: VideoRendererView,
    val secondaryVideoView: VideoRendererView,
    val primaryPlaceholder: TextView,
    val secondaryPlaceholder: TextView,
    val secondaryNameOverlay: TextView
)

class PipViewFactory(
    private val context: Context,
    private val appContext: AppContext
) {
    companion object {
        private const val PLACEHOLDER_COLOR = "#000000"
        private const val PLACEHOLDER_TEXT_COLOR = Color.WHITE
        private const val PLACEHOLDER_TEXT_SIZE_SP = 16f
        private const val VIDEO_LAYOUT_MODE = "FILL"
        
        private const val NAME_OVERLAY_TEXT_SIZE_SP = 12f
        private const val NAME_OVERLAY_PADDING_DP = 5
        private const val NAME_OVERLAY_MAX_WIDTH_DP = 80
        private const val NAME_OVERLAY_BG_COLOR = 0x4D000000
        private const val NAME_OVERLAY_CORNER_RADIUS_DP = 5f
    }

    fun createPipViews(
        primaryPlaceholderText: String,
        secondaryPlaceholderText: String
    ): PipViewContainer {
        val primaryContainer = createRelativeLayoutContainer()
        val secondaryContainer = createRelativeLayoutContainer()

        val primaryPlaceholder = createPlaceholderTextView(primaryPlaceholderText)
        val secondaryPlaceholder = createPlaceholderTextView(secondaryPlaceholderText)

        val primaryVideoView = createVideoView()
        val secondaryVideoView = createVideoView()
        
        val secondaryNameOverlay = createNameOverlayTextView()

        primaryContainer.apply {
            addView(primaryPlaceholder, createMatchParentLayoutParams())
            addView(primaryVideoView, createCenteredLayoutParams())
        }

        secondaryContainer.apply {
            addView(secondaryPlaceholder, createMatchParentLayoutParams())
            addView(secondaryVideoView, createCenteredLayoutParams())
            addView(secondaryNameOverlay, createNameOverlayLayoutParams())
        }

        val splitScreenContainer = createSplitScreenContainer().apply {
            addView(primaryContainer)
            addView(secondaryContainer)
        }

        return PipViewContainer(
            splitScreenContainer = splitScreenContainer,
            primaryContainer = primaryContainer,
            secondaryContainer = secondaryContainer,
            primaryVideoView = primaryVideoView,
            secondaryVideoView = secondaryVideoView,
            primaryPlaceholder = primaryPlaceholder,
            secondaryPlaceholder = secondaryPlaceholder,
            secondaryNameOverlay = secondaryNameOverlay
        )
    }

    private fun createPlaceholderTextView(text: String): TextView {
        return TextView(context).apply {
            this.text = text
            setTextColor(PLACEHOLDER_TEXT_COLOR)
            gravity = Gravity.CENTER
            setTextSize(TypedValue.COMPLEX_UNIT_SP, PLACEHOLDER_TEXT_SIZE_SP)
            setBackgroundColor(Color.parseColor(PLACEHOLDER_COLOR))
        }
    }

    private fun createVideoView(): VideoRendererView {
        return VideoRendererView(context, appContext).apply {
            setVideoLayout(VIDEO_LAYOUT_MODE)
            visibility = View.GONE
        }
    }

    private fun createSplitScreenContainer(): LinearLayout {
        return LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
    }

    private fun createRelativeLayoutContainer(): RelativeLayout {
        return RelativeLayout(context).apply {
            layoutParams = LinearLayout.LayoutParams(
                0,
                ViewGroup.LayoutParams.MATCH_PARENT,
                1f
            )
        }
    }

    private fun createMatchParentLayoutParams(): RelativeLayout.LayoutParams {
        return RelativeLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        )
    }

    private fun createCenteredLayoutParams(): RelativeLayout.LayoutParams {
        return RelativeLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ).apply {
            addRule(RelativeLayout.CENTER_IN_PARENT)
        }
    }
    
    private fun createNameOverlayTextView(): TextView {
        val paddingPx = dpToPx(NAME_OVERLAY_PADDING_DP)
        val maxWidthPx = dpToPx(NAME_OVERLAY_MAX_WIDTH_DP)
        val cornerRadiusPx = dpToPx(NAME_OVERLAY_CORNER_RADIUS_DP.toInt()).toFloat()
        
        val background = GradientDrawable().apply {
            setColor(NAME_OVERLAY_BG_COLOR.toInt())
            cornerRadii = floatArrayOf(
                cornerRadiusPx, cornerRadiusPx,
                0f, 0f,
                0f, 0f,
                0f, 0f
            )
        }
        
        return TextView(context).apply {
            setTextColor(PLACEHOLDER_TEXT_COLOR)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, NAME_OVERLAY_TEXT_SIZE_SP)
            setPadding(paddingPx, paddingPx, paddingPx, paddingPx)
            maxWidth = maxWidthPx
            maxLines = 1
            ellipsize = TextUtils.TruncateAt.END
            setBackground(background)
            visibility = View.GONE
        }
    }
    
    private fun createNameOverlayLayoutParams(): RelativeLayout.LayoutParams {
        return RelativeLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        ).apply {
            addRule(RelativeLayout.ALIGN_PARENT_BOTTOM)
            addRule(RelativeLayout.ALIGN_PARENT_END)
        }
    }
    
    private fun dpToPx(dp: Int): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            dp.toFloat(),
            context.resources.displayMetrics
        ).toInt()
    }
}

