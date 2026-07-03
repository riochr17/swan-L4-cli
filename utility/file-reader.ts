import path from 'path';
import fs from 'fs';
import { readChunk } from 'read-chunk';
import { fileTypeFromBuffer } from 'file-type';
import { PDFParse } from 'pdf-parse';
import XLSX from 'xlsx';
import mammoth from 'mammoth';
import OfficeParser from 'officeparser';
import axios from 'axios';
import { AxiosError } from 'axios';
import { isUtf8 } from 'node:buffer';

export async function superRead(relative_dir: string, file_or_url_path?: string) {
  if (file_or_url_path?.startsWith('http')) {
    return await readUrlFile(file_or_url_path);
  }
  return await readLocalFile(relative_dir, file_or_url_path);
}

export async function readLocalFile(relative_dir: string, filepath?: string): Promise<string> {
  if (!filepath) {
    return `[Error] Path ${filepath} doesnt exist`;
  }
  const abs_r1_path = path.resolve(relative_dir, filepath);
  if (!fs.existsSync(abs_r1_path)) {
    return `[Error] Path ${abs_r1_path} doesnt exist`;
  }

  const buffer = await readChunk(abs_r1_path, {length: 4100});
  const type = isUtf8(buffer) ? { ext: 'txt' } : await fileTypeFromBuffer(buffer);
  if (type) {
    return await readFileByExtension(await fs.promises.readFile(abs_r1_path), type.ext);
  }
  return `[Error]: File type cannot be defined (the file might be corrupted or encrypted)`
}

export async function readUrlFile(url: string): Promise<string> {
  if (!url.startsWith('http')) {
    return `URL ${url} is not valid`;
  }
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
    const buffer = Buffer.from(response.data);

    const type = isUtf8(buffer) ? { ext: 'txt' } : await fileTypeFromBuffer(buffer);
    if (type) {
      return await readFileByExtension(buffer, type.ext);
    }
    return `[Error]: File type cannot be defined (the file might be corrupted or encrypted)`
  } catch (err) {
    if (err instanceof AxiosError) {
      return `[Fetching File Error] ${err.response?.data?.toString() ?? ''}`;
    }
    return `[Axios Error]: ${(err as Error)?.message}`;
  }
}

export async function readFileByExtension(buffer: Buffer, ext: string): Promise<string> {
  switch (ext) {
    case 'txt':
      return buffer.toString('utf8');
    case 'pdf': // - Portable Document Format
      const pdf_res = await (new PDFParse(new Uint8Array(buffer))).getText();
      return pdf_res.text;
    case 'xlsx': // - Microsoft Excel document
      // 1. Read the workbook
      const xlsx_workbook = XLSX.read(buffer);
      const xlsx_output: string[] = [];
      // 2. Loop through every sheet and print its raw text string
      xlsx_workbook.SheetNames.forEach(sheetName => {
        const worksheet = xlsx_workbook.Sheets[sheetName];
        if (worksheet) {
          // 3. Convert the active sheet to raw CSV text layout
          const rawCsvText = XLSX.utils.sheet_to_csv(worksheet);
          xlsx_output.push([
            `## Sheet: ${sheetName}`,
            rawCsvText,
          ].join('\n'));
        }
      });
      return xlsx_output.join('\n\n');
    case 'docx': // - Microsoft Word document
      try {
        // Extract raw text from the document
        const docx_result = await mammoth.extractRawText({ buffer });
        const docx_text = docx_result.value; // The raw extracted text
        const docx_messages = docx_result.messages; // Any warnings or errors during parsing
        return docx_text;
      } catch (error) {
        return `[Error] reading docx file: ${(error as Error)?.message}`;
      }
    case 'pptx': // - Microsoft PowerPoint document
      try {
        // Works seamlessly for .pptx, .docx, or .xlsx
        // 1. Parse the file to get the full Abstract Syntax Tree (AST)
        const pptx_ast = await OfficeParser.parseOffice(buffer);
        
        // 3. Request RAG-focused document blocks ('chunks') natively from the AST instance
        const { value: pptx_chunks } = await pptx_ast.to('chunks');

        // 4. Map the elements down to only clean text and page references
        const pptx_simplifiedData = pptx_chunks.map(chunk => {
          return [
            `## Page ${chunk.metadata?.pageNumber || chunk.metadata?.slideNumber || 1 }`,
            chunk.text.trim(),
            // Extracts the target layout marker or defaults safely to 1
          ].join('\n')
        });

        return pptx_simplifiedData.join('\n\n');
      } catch (error) {
        return `[Error] Failed to parse pptx: ${(error as Error)?.message}`;
      }

    case '3g2': // - Multimedia container format defined by the 3GPP2 for 3G CDMA2000 multimedia services
    case '3gp': // - Multimedia container format defined by the Third Generation Partnership Project (3GPP) for 3G UMTS multimedia services
    case '3mf': // - 3D Manufacturing Format
    case '7z': // - 7-Zip archive
    case 'Z': // - Unix Compressed File
    case 'aac': // - Advanced Audio Coding
    case 'ac3': // - ATSC A/52 Audio File
    case 'ace': // - ACE archive
    case 'aif': // - Audio Interchange file
    case 'alias': // - macOS Alias file
    case 'amr': // - Adaptive Multi-Rate audio codec
    case 'ape': // - Monkey's Audio
    case 'apk': // - Android package format
    case 'apng': // - Animated Portable Network Graphics
    case 'ar': // - Archive file
    case 'arj': // - Archive file
    case 'arrow': // - Columnar format for tables of data
    case 'arw': // - Sony Alpha Raw image file
    case 'asar': // - Archive format primarily used to enclose Electron applications
    case 'asf': // - Advanced Systems Format
    case 'avi': // - Audio Video Interleave file
    case 'avif': // - AV1 Image File Format
    case 'avro': // - Object container file developed by Apache Avro
    case 'blend': // - Blender project
    case 'bmp': // - Bitmap image file
    case 'bpg': // - Better Portable Graphics file
    case 'bz2': // - Archive file
    case 'cab': // - Cabinet file
    case 'cfb': // - Compound File Binary Format
    case 'chm': // - Microsoft Compiled HTML Help
    case 'class': // - Java class file
    case 'cpio': // - Cpio archive
    case 'cr2': // - Canon Raw image file (v2)
    case 'cr3': // - Canon Raw image file (v3)
    case 'crx': // - Google Chrome extension
    case 'cur': // - Icon file
    case 'dat': // - Windows registry hive file
    case 'dcm': // - DICOM Image File
    case 'deb': // - Debian package
    case 'dmg': // - Apple Disk Image
    case 'dng': // - Adobe Digital Negative image file
    case 'docm': // - Microsoft Word macro-enabled document
    case 'dotm': // - Microsoft Word macro-enabled template
    case 'dotx': // - Microsoft Word template
    case 'drc': // - Google's Draco 3D Data Compression
    case 'dsf': // - Sony DSD Stream File (DSF)
    case 'dwg': // - Autodesk CAD file
    case 'elf': // - Unix Executable and Linkable Format
    case 'eot': // - Embedded OpenType font
    case 'eps': // - Encapsulated PostScript
    case 'epub': // - E-book file
    case 'exe': // - Executable file
    case 'f4a': // - Audio-only ISO base media file format used by Adobe Flash Player
    case 'f4b': // - Audiobook and podcast ISO base media file format used by Adobe Flash Player
    case 'f4p': // - ISO base media file format protected by Adobe Access DRM used by Adobe Flash Player
    case 'f4v': // - ISO base media file format used by Adobe Flash Player
    case 'fbx': // - Filmbox is a proprietary file format used to provide interoperability between digital content creation apps.
    case 'flac': // - Free Lossless Audio Codec
    case 'flif': // - Free Lossless Image Format
    case 'flv': // - Flash video
    case 'gif': // - Graphics Interchange Format
    case 'glb': // - GL Transmission Format
    case 'gz': // - Archive file
    case 'heic': // - High Efficiency Image File Format
    case 'icc': // - ICC Profile
    case 'icns': // - Apple Icon image
    case 'ico': // - Windows icon file
    case 'ics': // - iCalendar
    case 'indd': // - Adobe InDesign document
    case 'it': // - Audio module format: Impulse Tracker
    case 'j2c': // - JPEG 2000
    case 'jar': // - Java archive
    case 'jls': // - Lossless/near-lossless compression standard for continuous-tone images
    case 'jmp': // - JMP data file format by SAS Institute
    case 'jp2': // - JPEG 2000
    case 'jpg': // - Joint Photographic Experts Group image
    case 'jpm': // - JPEG 2000
    case 'jpx': // - JPEG 2000
    case 'jxl': // - JPEG XL image format
    case 'jxr': // - Joint Photographic Experts Group extended range
    case 'key': // - Apple Keynote presentation
    case 'ktx': // - OpenGL and OpenGL ES textures
    case 'lnk': // - Microsoft Windows file shortcut
    case 'lz': // - Archive file
    case 'lz4': // - Compressed archive created by one of a variety of LZ4 compression utilities
    case 'lzh': // - LZH archive
    case 'm4a': // - Audio-only MPEG-4 files
    case 'm4b': // - Audiobook and podcast MPEG-4 files, which also contain metadata including chapter markers, images, and hyperlinks
    case 'm4p': // - MPEG-4 files with audio streams encrypted by FairPlay Digital Rights Management as were sold through the iTunes Store
    case 'm4v': // - Video container format developed by Apple, which is very similar to the MP4 format
    case 'macho': // - Mach-O binary format
    case 'mid': // - Musical Instrument Digital Interface file
    case 'mie': // - Dedicated meta information format which supports storage of binary as well as textual meta information
    case 'mj2': // - Motion JPEG 2000
    case 'mkv': // - Matroska video file
    case 'mobi': // - Mobipocket
    case 'mov': // - QuickTime video file
    case 'mp1': // - MPEG-1 Audio Layer I
    case 'mp2': // - MPEG-1 Audio Layer II
    case 'mp3': // - Audio file
    case 'mp4': // - MPEG-4 Part 14 video file
    case 'mpc': // - Musepack (SV7 & SV8)
    case 'mpg': // - MPEG-1 file
    case 'mts': // - MPEG-2 Transport Stream, both raw and Blu-ray Disc Audio-Video (BDAV) versions
    case 'mxf': // - Material Exchange Format
    case 'nef': // - Nikon Electronic Format image file
    case 'nes': // - Nintendo NES ROM
    case 'numbers': // - Apple Numbers spreadsheet
    case 'odg': // - OpenDocument for drawing
    case 'odp': // - OpenDocument for presentations
    case 'ods': // - OpenDocument for spreadsheets
    case 'odt': // - OpenDocument for word processing
    case 'oga': // - Audio file
    case 'ogg': // - Audio file
    case 'ogm': // - Audio file
    case 'ogv': // - Audio file
    case 'ogx': // - Audio file
    case 'opus': // - Audio file
    case 'orf': // - Olympus Raw image file
    case 'otf': // - OpenType font
    case 'otg': // - OpenDocument template for drawing
    case 'otp': // - OpenDocument template for presentations
    case 'ots': // - OpenDocument template for spreadsheets
    case 'ott': // - OpenDocument template for word processing
    case 'pages': // - Apple Pages document
    case 'parquet': // - Apache Parquet
    case 'pcap': // - Libpcap File Format
    case 'pgp': // - Pretty Good Privacy
    case 'png': // - Portable Network Graphics
    case 'potm': // - Microsoft PowerPoint macro-enabled template
    case 'potx': // - Microsoft PowerPoint template
    case 'ppsm': // - Office PowerPoint 2007 macro-enabled slide show
    case 'ppsx': // - Office PowerPoint 2007 slide show
    case 'pptm': // - Microsoft PowerPoint macro-enabled document
    case 'ps': // - PostScript
    case 'psd': // - Adobe Photoshop document
    case 'pst': // - Personal Storage Table file
    case 'qcp': // - Tagged and chunked data
    case 'raf': // - Fujifilm RAW image file
    case 'rar': // - Archive file
    case 'reg': // - Windows registry (entries) file format
    case 'rm': // - RealMedia
    case 'rpm': // - Red Hat Package Manager file
    case 'rtf': // - Rich Text Format
    case 'rw2': // - Panasonic RAW image file
    case 's3m': // - Audio module format: ScreamTracker 3
    case 'sav': // - SPSS Statistical Data File
    case 'shp': // - Geospatial vector data format
    case 'skp': // - SketchUp
    case 'spx': // - Audio file
    case 'sqlite': // - SQLite file
    case 'stl': // - Standard Tessellated Geometry File Format (ASCII only)
    case 'swf': // - Adobe Flash Player file
    case 'tar': // - Tape archive or tarball
    case 'tar': //.gz - Gzipped tape archive (tarball)
    case 'tif': // - Tagged Image file
    case 'ttc': // - TrueType Collection font
    case 'ttf': // - TrueType font
    case 'vcf': // - vCard
    case 'voc': // - Creative Voice File
    case 'vsdx': // - Microsoft Visio File
    case 'vtt': // - WebVTT File (for video captions)
    case 'wasm': // - WebAssembly intermediate compiled format
    case 'wav': // - Waveform Audio file
    case 'webm': // - Web video file
    case 'webp': // - Web Picture format
    case 'woff': // - Web Open Font Format
    case 'woff2': // - Web Open Font Format
    case 'wv': // - WavPack
    case 'xcf': // - eXperimental Computing Facility
    case 'xlsm': // - Microsoft Excel macro-enabled document
    case 'xltm': // - Microsoft Excel macro-enabled template
    case 'xltx': // - Microsoft Excel template
    case 'xm': // - Audio module format: FastTracker 2
    case 'xml': // - eXtensible Markup Language
    case 'xpi': // - XPInstall file
    case 'xz': // - Compressed file
    case 'zip': // - Archive file
    case 'zst': // - Archive file
    default:
      return `[Unsuppoted file]: Your filetype is not supported yet.`
  }
}
