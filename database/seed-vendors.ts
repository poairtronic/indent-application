import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const vendors = [
  { vendorCode: 'AGIPL-VEN-001', vendorName: 'Suriya Cnc', address: '67,Bharathi, Street, TMP nagar padi, Ch-50', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600050', phone: '9952569904', email: 'cncsurya@gmail.com' },
  { vendorCode: 'AGIPL-VEN-002', vendorName: 'NV.CNC Technologies', address: 'No,18, Kamaraj street srinivasa nagar padi, chennai-50', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600050', phone: '9840774313', email: 'nvcnctech@gmail.com' },
  { vendorCode: 'AGIPL-VEN-003', vendorName: 'Micromac cnc', address: 'No,36A Gandhi street Mathiyazhagan nagar padi-chennai-50', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600050', phone: '9080641141', email: 'micromaccnc@yahoo.com' },
  { vendorCode: 'AGIPL-VEN-004', vendorName: 'E.L.Tools &Gauges', address: '21, kamabar st, srinivasanagar,padi- ch-50', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600050', phone: '9789931808', email: 'eltoolsgauges@gmail.com' },
  { vendorCode: 'AGIPL-VEN-005', vendorName: 'Nisha Tools', address: 'Padi-50', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600050', phone: null, email: 'nishatools@placeholder.com' },
  { vendorCode: 'AGIPL-VEN-006', vendorName: 'Excellent Metal Treaters', address: 'No,1,Vallalar Chettiyaragaram,Vanagaram chennai-77', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600077', phone: '9940538018', email: 'excellentmetaltreaters@gmail.com' },
  { vendorCode: 'AGIPL-VEN-007', vendorName: 'G.A.Tools', address: 'No,9 Thiruvallur Street TMP Nagar chennai-50', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600050', phone: '9841376747', email: 'gatools25@yahoo.com' },
  { vendorCode: 'AGIPL-VEN-008', vendorName: 'J.V.Tools', address: 'No,55/56 padi chennai-50', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600050', phone: '8056204075', email: 'jvtools@placeholder.com' },
  { vendorCode: 'AGIPL-VEN-009', vendorName: 'V.S.Engineering', address: 'No,289/8,Mustafa street,Rajarajan nagar, chennai-95', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600095', phone: '9444826790', email: 'manogaran9444826790@gmail.com' },
  { vendorCode: 'AGIPL-VEN-010', vendorName: 'R.K.V. Engineering', address: 'no,84/2,sidco industrial estate chennai-98', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600098', phone: '9941294839', email: 'rkvmetalfinishers@gmail.com' },
  { vendorCode: 'AGIPL-VEN-011', vendorName: 'Export Surface Finishers', address: 'NO 22A,PKM ROAD ATHIPET,,AMBATTUR INDUSTRIAL EST Athipet, Chennai-600058', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600058', phone: null, email: 'exportsurfacefinishers@placeholder.com' },
  { vendorCode: 'AGIPL-VEN-012', vendorName: 'Ganesh Sai Industries', address: 'No,12/A, Kamaraj 1 st cross street Srinivasa nagar Chennai-50', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600050', phone: '9789010263', email: 'ganeshsai343@gmail.com' },
  { vendorCode: 'AGIPL-VEN-013', vendorName: 'Sri Senthor Murugan Engineer', address: 'No,55/66,Mariamman koil street Tmp Nagar Padi- Chennai-50', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600050', phone: '9941438054', email: 'srism2016@gmail.com' },
  { vendorCode: 'AGIPL-VEN-014', vendorName: 'SRI SIVAM Industries', address: '10/6,Periyar cross street Srinivasa nagar chennai-50', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600050', phone: '9884344942', email: 'srisivamindustries@placeholder.com' },
  { vendorCode: 'AGIPL-VEN-015', vendorName: 'K.R.Tech Engineering', address: 'No,91/56,Mathiazhagan nagar Mariamman koil street Padi- Chennai-50', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600050', phone: '9003223440', email: 'krtechengineering@gmail.com' },
  { vendorCode: 'AGIPL-VEN-016', vendorName: 'Hi-Tech Honing', address: 'No,14A,/10 Kamarajar street Gopal Naickar nagar Padi- Chennai-50', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600050', phone: '9444018359', email: 'hitechhoning@rediffmail.com' },
  { vendorCode: 'AGIPL-VEN-017', vendorName: 'GSM Engineers', address: 'No,11/22A,Bharathiyar street srinivasa nagar, Padi- Chennai-50', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600050', phone: '7904277413', email: 'gsmengineerschennai@gmail.com' },
  { vendorCode: 'AGIPL-VEN-018', vendorName: 'Sabari Spark', address: 'No,110, Vanniar street Padi- Chennai-50', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600050', phone: '9551280002', email: 'sabarisparkwirecut@gmail.com' },
  { vendorCode: 'AGIPL-VEN-019', vendorName: 'N.R.S. Engineering', address: 'No,14A,/10 Kamarajar street Gopal Naickar nagar Padi- Chennai-50', city: 'Chennai', state: 'Tamil Nadu', country: 'India', pincode: '600050', phone: '9841895770', email: 'nrsengineering13@gmail.com' }
];

async function main() {
  console.log('Seeding vendors...');
  for (const v of vendors) {
    try {
      const existing = await prisma.vendor.findUnique({ where: { vendorCode: v.vendorCode } });
      if (!existing) {
         await prisma.vendor.create({ data: v });
         console.log(`Created vendor ${v.vendorCode}`);
      } else {
         console.log(`Vendor ${v.vendorCode} already exists`);
      }
    } catch (err) {
      console.error(`Error creating vendor ${v.vendorCode}:`, err);
    }
  }
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
