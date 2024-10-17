extension UIView {
    var isEffectivelyHidden: Bool {
        if isHidden {
            return true
        } else {
            return superview?.isEffectivelyHidden ?? false
        }
    }
}
