package io.fishjam.reactnative.utils

import com.fishjamcloud.client.models.Dimensions

data class AspectRatio(
  val width: Int,
  val height: Int
) {
  companion object {
    private val zero = AspectRatio(0, 0)

    private fun gcd(
      a: Int,
      b: Int
    ): Int = if (b == 0) a else gcd(b, a % b)

    fun create(
      width: Int,
      height: Int
    ): AspectRatio {
      if (width <= 0 || height <= 0) {
        return zero
      }
      val divisor = gcd(width, height)
      return AspectRatio(width / divisor, height / divisor)
    }

    fun create(dimensions: Dimensions?): AspectRatio =
      if (dimensions != null) {
        create(dimensions.width, dimensions.height)
      } else {
        zero
      }
  }

  fun toMap(): Map<String, Int> =
    mapOf(
      "width" to width,
      "height" to height
    )
}
