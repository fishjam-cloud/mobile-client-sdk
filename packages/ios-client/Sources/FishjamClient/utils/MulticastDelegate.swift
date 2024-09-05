import Foundation

/// Implementation of a multicast delegate
public class MulticastDelegate<T>: NSObject {
    private let queue = DispatchQueue(label: "membrane.multicast")
    private let delegates = NSHashTable<AnyObject>.weakObjects()

    /// Add a single delegate.
    public func add(delegate: T) {
        guard let delegate = delegate as AnyObject? else {
            return
        }

        queue.sync { delegates.add(delegate) }
    }

    public func remove(delegate: T) {
        guard let delegate = delegate as AnyObject? else {
            return
        }

        queue.sync { delegates.remove(delegate) }
    }

    internal func notify(_ fn: @escaping (T) -> Void) {
        queue.async {
            for delegate in self.delegates.objectEnumerator() {
                guard let delegate = delegate as? T else {
                    continue
                }

                fn(delegate)
            }
        }
    }
}
