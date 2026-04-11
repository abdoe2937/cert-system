const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const EXCEL_PATH = path.join(__dirname, '..', 'data', 'users.xlsx');

// Ensure data directory exists
const ensureDir = () => {
  const dir = path.dirname(EXCEL_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const HEADERS = [
  { header: 'الاسم الكامل',     key: 'fullName',         width: 25 },
  { header: 'البريد الإلكتروني', key: 'email',            width: 28 },
  { header: 'رقم الهاتف',       key: 'phone',            width: 18 },
  { header: 'كود الطالب',       key: 'studentCode',      width: 18 },
  { header: 'المحافظة',         key: 'governorate',      width: 16 },
  { header: 'الجنس',            key: 'gender',           width: 10 },
  { header: 'المؤهل الدراسي',   key: 'education',        width: 20 },
  { header: 'الوظيفة',          key: 'job',              width: 18 },
  { header: 'اسم الكورس',       key: 'courseName',       width: 25 },
  { header: 'مستوى الخبرة',     key: 'experienceLevel',  width: 16 },
  { header: 'الهدف',            key: 'goal',             width: 14 },
  { header: 'تاريخ التسجيل',    key: 'createdAt',        width: 20 },
];

// Header style
const headerStyle = {
  font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12, name: 'Arial' },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3A6B' } },
  alignment: { horizontal: 'center', vertical: 'middle', readingOrder: 2 },
  border: {
    top:    { style: 'thin', color: { argb: 'FFAAAAAA' } },
    bottom: { style: 'thin', color: { argb: 'FFAAAAAA' } },
    left:   { style: 'thin', color: { argb: 'FFAAAAAA' } },
    right:  { style: 'thin', color: { argb: 'FFAAAAAA' } },
  },
};

const rowStyle = (isEven) => ({
  font: { name: 'Arial', size: 11 },
  fill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: isEven ? 'FFF0F4FF' : 'FFFFFFFF' },
  },
  alignment: { horizontal: 'center', vertical: 'middle', readingOrder: 2 },
});

const goalMap = { job: 'توظيف', skill: 'مهارة', career: 'تطوير مهني' };
const levelMap = { beginner: 'مبتدئ', intermediate: 'متوسط', advanced: 'متقدم' };
const genderMap = { male: 'ذكر', female: 'أنثى' };

const appendUserToExcel = async (user) => {
  ensureDir();

  let workbook = new ExcelJS.Workbook();
  let worksheet;

  // Load existing file or create new
  if (fs.existsSync(EXCEL_PATH)) {
    await workbook.xlsx.readFile(EXCEL_PATH);
    worksheet = workbook.worksheets[0]; // ياخد أول sheet موجود مهما كان اسمه
    if (!worksheet) {
      worksheet = workbook.addWorksheet('Users');
    }
  } else {
    worksheet = workbook.addWorksheet('المتطوعون');
    worksheet.views = [{ rightToLeft: true }];

    // Set columns
    worksheet.columns = HEADERS;

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    HEADERS.forEach((_, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.style = headerStyle;
    });
    headerRow.commit();
  }

  // Add user data row
  const rowData = {
    fullName:        user.fullName        || '',
    email:           user.email           || '',
    phone:           user.phone           || '',
    studentCode:     user.studentCode     || '',
    governorate:     user.governorate     || '',
    gender:          genderMap[user.gender] || user.gender || '',
    education:       user.education       || '',
    job:             user.job             || '',
    courseName:      user.courseName      || '',
    experienceLevel: levelMap[user.experienceLevel] || user.experienceLevel || '',
    goal:            goalMap[user.goal]   || user.goal || '',
    createdAt:       new Date(user.createdAt).toLocaleDateString('ar-EG'),
  };

  const newRow = worksheet.addRow(rowData);
  const isEven = newRow.number % 2 === 0;
  newRow.height = 22;
  HEADERS.forEach((_, i) => {
    newRow.getCell(i + 1).style = rowStyle(isEven);
  });
  newRow.commit();

  await workbook.xlsx.writeFile(EXCEL_PATH);
  console.log(`✅ Excel updated: ${user.fullName}`);
};

module.exports = { appendUserToExcel };
