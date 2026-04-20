const ExcelJS = require('exceljs');
const path    = require('path');
const fs      = require('fs');
const os      = require('os');

// ── Excel file path — داخل المشروع نفسه ──────────────────────
// الملف هيتحفظ في: backend/data/users.xlsx
const EXCEL_PATH = path.join(__dirname, '..', 'data', 'users.xlsx');

const ensureDir = () => {
  const dir = path.dirname(EXCEL_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const HEADERS = [
  { header: 'الاسم بالعربية',     key: 'fullNameAr',       width: 25 },
  { header: 'الاسم بالإنجليزية',  key: 'fullNameEn',       width: 25 },
  { header: 'البريد الإلكتروني',  key: 'email',            width: 28 },
  { header: 'رقم الهاتف',         key: 'phone',            width: 18 },
  { header: 'كود الطالب',         key: 'studentCode',      width: 18 },
  { header: 'المحافظة',           key: 'governorate',      width: 16 },
  { header: 'الجنس',              key: 'gender',           width: 10 },
  { header: 'نوع الإعاقة السمعية',key: 'hearingType',      width: 22 },
  { header: 'المؤهل الدراسي',     key: 'education',        width: 20 },
  { header: 'الوظيفة',            key: 'job',              width: 18 },
  { header: 'اسم الكورس',         key: 'courseName',       width: 25 },
  { header: 'مستوى الخبرة',       key: 'experienceLevel',  width: 16 },
  { header: 'الهدف',              key: 'goal',             width: 14 },
  { header: 'تاريخ التسجيل',      key: 'createdAt',        width: 20 },
];

const headerStyle = {
  font:      { bold:true, color:{argb:'FFFFFFFF'}, size:11, name:'Arial' },
  fill:      { type:'pattern', pattern:'solid', fgColor:{argb:'FF1A3A6B'} },
  alignment: { horizontal:'center', vertical:'middle', readingOrder:2 },
  border: {
    top:    { style:'thin', color:{argb:'FFAAAAAA'} },
    bottom: { style:'thin', color:{argb:'FFAAAAAA'} },
    left:   { style:'thin', color:{argb:'FFAAAAAA'} },
    right:  { style:'thin', color:{argb:'FFAAAAAA'} },
  },
};

const rowStyle = (isEven) => ({
  font:      { name:'Arial', size:10 },
  fill:      { type:'pattern', pattern:'solid', fgColor:{argb: isEven ? 'FFF0F4FF' : 'FFFFFFFF'} },
  alignment: { horizontal:'center', vertical:'middle', readingOrder:2 },
});

const genderMap  = { male:'ذكر', female:'أنثى' };
const levelMap   = { beginner:'مبتدئ', intermediate:'متوسط', advanced:'متقدم' };
const goalMap    = { job:'توظيف', skill:'مهارة', career:'تطوير مهني' };
const hearingMap = { deaf:'أصم', hearing:'متكلم', interpreter:'مترجم إشارة' };

const appendUserToExcel = async (user) => {
  ensureDir();

  let workbook = new ExcelJS.Workbook();
  let worksheet;

  if (fs.existsSync(EXCEL_PATH)) {
    await workbook.xlsx.readFile(EXCEL_PATH);
    worksheet = workbook.worksheets[0];
    if (!worksheet) {
      worksheet = workbook.addWorksheet('المتطوعون');
      worksheet.views = [{ rightToLeft: true }];
      worksheet.columns = HEADERS;
      const headerRow = worksheet.getRow(1);
      headerRow.height = 28;
      HEADERS.forEach((_, i) => {
        headerRow.getCell(i + 1).style = headerStyle;
      });
      headerRow.commit();
    } else {
      // ← ده هو الحل - لازم تحدد الـ columns حتى لو الملف موجود
      worksheet.columns = HEADERS;
    }
  } else {
    worksheet = workbook.addWorksheet('المتطوعون');
    worksheet.views = [{ rightToLeft: true }];
    worksheet.columns = HEADERS;
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    HEADERS.forEach((_, i) => {
      headerRow.getCell(i + 1).style = headerStyle;
    });
    headerRow.commit();
  }

  const rowData = {
    fullNameAr:      user.fullNameAr      || user.fullName || '',
    fullNameEn:      user.fullNameEn      || user.fullName || '',
    email:           user.email           || '',
    phone:           user.phone           || '',
    studentCode:     user.studentCode     || '',
    governorate:     user.governorate     || '',
    gender:          genderMap[user.gender]    || user.gender    || '',
    hearingType:     hearingMap[user.hearingType] || user.hearingType || '',
    education:       user.education       || '',
    job:             user.job             || '',
    courseName:      user.courseName      || '',
    experienceLevel: levelMap[user.experienceLevel] || user.experienceLevel || '',
    goal:            goalMap[user.goal]   || user.goal   || '',
    createdAt:       new Date(user.createdAt).toLocaleDateString('ar-EG'),
  };

  const newRow = worksheet.addRow(rowData);
  const isEven = newRow.number % 2 === 0;
  newRow.height = 20;
  HEADERS.forEach((_, i) => {
    newRow.getCell(i + 1).style = rowStyle(isEven);
  });
  newRow.commit();

  await workbook.xlsx.writeFile(EXCEL_PATH);

  console.log('✅ Excel file saved at:');
  console.log('   ' + EXCEL_PATH);
  console.log('   User: ' + (user.fullNameEn || user.fullNameAr));
};

module.exports = { appendUserToExcel, EXCEL_PATH };
