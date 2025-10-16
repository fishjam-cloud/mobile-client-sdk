package io.fishjam.reactnative.helpers

import androidx.fragment.app.Fragment
import io.fishjam.reactnative.PipContainerView
import java.util.UUID

class PictureInPictureHelperFragment(private val containerView: PipContainerView) : Fragment() {
  val id = "${PictureInPictureHelperFragment::class.java.simpleName}_${UUID.randomUUID()}"

  override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean) {
    super.onPictureInPictureModeChanged(isInPictureInPictureMode)

    if (isInPictureInPictureMode) {
      containerView.layoutForPiPEnter()
    } else {
      containerView.layoutForPiPExit()
    }
  }
}

