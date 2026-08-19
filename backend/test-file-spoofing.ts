import { validateFileSignature } from './src/common/utils/file-validator.util';

async function testCases() {
  let passed = 0;
  let failed = 0;

  async function runTest(name: string, buffer: Buffer, ext: string, shouldPass: boolean) {
    try {
      await validateFileSignature(buffer, ext);
      if (shouldPass) {
        console.log(`[PASS] ${name}`);
        passed++;
      } else {
        console.error(`[FAIL] ${name} (Expected to fail but passed)`);
        failed++;
      }
    } catch (e: any) {
      if (!shouldPass) {
        console.log(`[PASS] ${name} - Rejected correctly: ${e.message}`);
        passed++;
      } else {
        console.error(`[FAIL] ${name} - Unexpectedly rejected: ${e.message}`);
        failed++;
      }
    }
  }

  console.log('Running File Spoofing Attack Tests...\n');

  // 1. Valid PDF
  const validPdf = Buffer.from('%PDF-1.4\n%âãÏÓ\n', 'utf8');
  await runTest('1. Valid PDF', validPdf, '.pdf', true);

  // 2. Renamed executable -> .pdf (MZ header for Windows EXE)
  const fakePdfExe = Buffer.from('4D5A90000300000004000000FFFF', 'hex');
  await runTest('2. Renamed executable -> .pdf', fakePdfExe, '.pdf', false);

  // 3. Renamed text file -> .pdf
  const fakePdfText = Buffer.from('Just some normal text here.', 'utf8');
  await runTest('3. Renamed text file -> .pdf', fakePdfText, '.pdf', false);

  // 4. Empty file
  const emptyFile = Buffer.alloc(0);
  await runTest('4. Empty file -> .pdf', emptyFile, '.pdf', false);

  // 5. Valid JPG
  const validJpg = Buffer.from('FFD8FFE000104A464946000101', 'hex');
  await runTest('5. Valid JPG', validJpg, '.jpg', true);

  // 6. Valid PNG (Needs to be a minimum viable PNG with IHDR chunk for file-type)
  const validPngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
  const validPng = Buffer.from(validPngBase64, 'base64');
  await runTest('6. Valid PNG', validPng, '.png', true);

  // 7. Malicious filename / Path traversal
  // Wait, path traversal happens in storage service, our validator only checks buffer/ext.
  // But let's check ext spoofing like 'malicious.pdf.exe' -> ext is '.exe'
  await runTest('7. Malicious filename (.exe)', fakePdfExe, '.exe', false);

  // 8. Valid DWG (Starts with ASCII AC10)
  const validDwg = Buffer.from('AC1027000000', 'utf8');
  await runTest('8. Valid DWG', validDwg, '.dwg', true);

  // 9. Fake DWG (Text renamed to DWG)
  const fakeDwg = Buffer.from('Some random text', 'utf8');
  await runTest('9. Fake DWG', fakeDwg, '.dwg', false);

  // 10. Valid DXF
  const validDxf = Buffer.from('  0\nSECTION\n  2\nHEADER\n', 'utf8');
  await runTest('10. Valid DXF', validDxf, '.dxf', true);

  // 11. Fake DXF (Not starting with 0 or 999)
  const fakeDxf = Buffer.from('This is a text file that has nothing to do with CAD', 'utf8');
  await runTest('11. Fake DXF', fakeDxf, '.dxf', false);

  // 12. Valid Legacy XLS
  const validXls = Buffer.from('D0CF11E0A1B11AE1000000', 'hex');
  await runTest('12. Valid XLS', validXls, '.xls', true);

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

testCases();
