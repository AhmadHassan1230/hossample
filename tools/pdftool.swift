// PDF helper built on macOS PDFKit/CoreGraphics (Homebrew poppler is broken on this machine).
//   swiftc -O tools/pdftool.swift -o tools/.bin/pdftool
//   pdftool <file.pdf> text
//   pdftool <file.pdf> render <pixelsPerPoint> <outDir> [first-last]
//   pdftool <file.pdf> images <outDir> [first-last]   (original embedded JPEGs, per page)
import AppKit
import CoreGraphics
import Foundation
import PDFKit

let args = CommandLine.arguments
guard args.count >= 3 else {
    FileHandle.standardError.write("usage: pdftool <pdf> text|render|images ...\n".data(using: .utf8)!)
    exit(2)
}
let url = URL(fileURLWithPath: args[1])
let mode = args[2]

func pageRange(_ s: String?, _ count: Int) -> [Int] {
    guard let s = s else { return Array(1...count) }
    let parts = s.split(separator: "-").compactMap { Int($0) }
    if parts.count == 2 { return Array(max(1, parts[0])...min(count, parts[1])) }
    if parts.count == 1 { return [parts[0]] }
    return Array(1...count)
}

switch mode {
case "text":
    guard let doc = PDFDocument(url: url) else { exit(1) }
    for i in 0..<doc.pageCount {
        print("=== PAGE \(i + 1)")
        print(doc.page(at: i)?.string ?? "")
    }

case "render":
    guard let doc = PDFDocument(url: url), args.count >= 5, let scale = Double(args[3]) else { exit(1) }
    let outDir = args[4]
    for n in pageRange(args.count > 5 ? args[5] : nil, doc.pageCount) {
        guard let page = doc.page(at: n - 1) else { continue }
        let box = page.bounds(for: .mediaBox)
        let w = Int(box.width * scale), h = Int(box.height * scale)
        guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
                                  space: CGColorSpaceCreateDeviceRGB(),
                                  bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else { continue }
        ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
        ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
        ctx.scaleBy(x: scale, y: scale)
        ctx.translateBy(x: -box.origin.x, y: -box.origin.y)
        page.draw(with: .mediaBox, to: ctx)
        guard let img = ctx.makeImage(),
              let data = NSBitmapImageRep(cgImage: img).representation(using: .jpeg, properties: [.compressionFactor: 0.86])
        else { continue }
        try? data.write(to: URL(fileURLWithPath: "\(outDir)/p\(String(format: "%03d", n)).jpg"))
    }

case "images":
    guard let doc = CGPDFDocument(url as CFURL), args.count >= 4 else { exit(1) }
    let outDir = args[3]
    var seen = Set<Int>()  // identical streams reused across pages share a pointer
    for n in pageRange(args.count > 4 ? args[4] : nil, doc.numberOfPages) {
        guard let page = doc.page(at: n), let pageDict = page.dictionary else { continue }
        var index = 0
        func walk(_ resources: CGPDFDictionaryRef, depth: Int) {
            var xobjs: CGPDFDictionaryRef?
            guard depth < 6, CGPDFDictionaryGetDictionary(resources, "XObject", &xobjs), let xo = xobjs else { return }
            CGPDFDictionaryApplyBlock(xo, { _, value, _ in
                var stream: CGPDFStreamRef?
                guard CGPDFObjectGetValue(value, .stream, &stream), let s = stream,
                      let dict = CGPDFStreamGetDictionary(s) else { return true }
                var subtype: UnsafePointer<CChar>?
                CGPDFDictionaryGetName(dict, "Subtype", &subtype)
                let kind = subtype.map { String(cString: $0) } ?? ""
                if kind == "Image" {
                    let key = Int(bitPattern: UnsafeRawPointer(s))
                    if seen.contains(key) { return true }
                    seen.insert(key)
                    var format = CGPDFDataFormat.raw
                    var w: CGPDFInteger = 0, h: CGPDFInteger = 0
                    CGPDFDictionaryGetInteger(dict, "Width", &w)
                    CGPDFDictionaryGetInteger(dict, "Height", &h)
                    var filter: UnsafePointer<CChar>?
                    CGPDFDictionaryGetName(dict, "Filter", &filter)
                    var smask: CGPDFStreamRef?
                    let hasMask = CGPDFDictionaryGetStream(dict, "SMask", &smask)
                    if ProcessInfo.processInfo.environment["PDFTOOL_LIST"] != nil {
                        print("p\(n) depth=\(depth) \(w)x\(h) filter=\(filter.map { String(cString: $0) } ?? "-") smask=\(hasMask)")
                        return true
                    }
                    if let data = CGPDFStreamCopyData(s, &format) as Data?,
                       format == .jpegEncoded || format == .JPEG2000, w >= 400, h >= 300 {
                        index += 1
                        let ext = format == .JPEG2000 ? "jp2" : "jpg"
                        let name = "p\(String(format: "%03d", n))-\(index)-\(w)x\(h).\(ext)"
                        try? data.write(to: URL(fileURLWithPath: "\(outDir)/\(name)"))
                    } else if let data = CGPDFStreamCopyData(s, &format) as Data?, format == .raw,
                              w >= 400, h >= 300, !hasMask, data.count == Int(w) * Int(h) * 3,
                              let provider = CGDataProvider(data: data as CFData),
                              let img = CGImage(width: Int(w), height: Int(h), bitsPerComponent: 8, bitsPerPixel: 24,
                                                bytesPerRow: Int(w) * 3, space: CGColorSpaceCreateDeviceRGB(),
                                                bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.none.rawValue),
                                                provider: provider, decode: nil, shouldInterpolate: false,
                                                intent: .defaultIntent),
                              let jpeg = NSBitmapImageRep(cgImage: img).representation(using: .jpeg, properties: [.compressionFactor: 0.9]) {
                        // Flate-encoded RGB (Canva stores some photos this way)
                        index += 1
                        let name = "p\(String(format: "%03d", n))-\(index)-\(w)x\(h)-raw.jpg"
                        try? jpeg.write(to: URL(fileURLWithPath: "\(outDir)/\(name)"))
                    }
                } else if kind == "Form" {
                    var res: CGPDFDictionaryRef?
                    if CGPDFDictionaryGetDictionary(dict, "Resources", &res), let r = res { walk(r, depth: depth + 1) }
                }
                return true
            }, nil)
        }
        var resources: CGPDFDictionaryRef?
        if CGPDFDictionaryGetDictionary(pageDict, "Resources", &resources), let r = resources { walk(r, depth: 0) }
    }

default:
    exit(2)
}
