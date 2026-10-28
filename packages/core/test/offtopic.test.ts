import { describe, expect, it } from 'vitest'
import { isOffTopic } from '../src/offtopic'

// Real titles that the "qa", "game", "cloud" and "devops" keywords pulled in.
const OFF = [
  'Nhân viên QC IQC/OQC',
  'Nhân Viên QC Phòng Lab',
  'NHÂN VIÊN KIỂM SOÁT CHẤT LƯỢNG SẢN PHẨM (QC)',
  'Chuyên Viên Thử Nghiệm (Hóa học)',
  'Phú Quốc - Chuyên Viên Kiểm Soát Khối Lượng - Thi Công Xây Dựng',
  'NHÂN VIÊN QC – NHÀ MÁY NHÔM',
  '[Long An] Production Supervisor',
  'Chuyên Viên ISO Phụ Trách Hệ Thống',
  'Streamer Game Fulltime- Parttime',
  'Nhân Viên Livestream Game',
  'Video Editor Freelancer (Mobile App & Casual Game)',
  'Nhân Viên Đạo Cụ (Lắp Ghép Lego)',
  'Chuyên Viên Quảng Cáo Game (UA Specialist) / Từ 1 Năm Kinh Nghiệm',
  'Nhân Viên Tư Vấn Sale Online/ Chăm Sóc Khách Hàng (Game)',
  'Chuyên viên Kinh doanh Cloud, An ninh mạng',
  'Kỹ sư Presale giải pháp Công nghệ thông tin (khối Chính phủ)',
  'Transportation Operation Executive – Trucking Operation',
  'KOREAN IT INTERPRETER',
  'Chuyên Gia Định Phí',
  'Nhân Viên Vận Hành Game MMO',
  'Game Master',
  '2D Artist - Hoạ Sĩ Hoạt Hình Anime',
  '3D Artist/3D Modeler (Maya/Photoshop/Zbrush)',
  'Nhân Viên Diễn Hoạt Game (Roblox/Minecraft)',
  'Nhân Viên Kỹ Thuật (Khu Vui Chơi Video Game)',
]

const IT = [
  'Tester',
  'Associate Quality Engineer (Automation)',
  'QA Game Tester',
  'Mobile Game QA',
  'Chuyên viên Kiểm thử ứng dụng',
  'Unity Developer Intern',
  'Game Developer (Unity, C#, OOP)',
  'Game server developer (C++, MySQL)',
  'Game Designer',
  'DevOps Engineer (GAME SYSTEM)',
  'Kỹ Sư Phát Triển Và Vận Hành DevOps',
  'AI Engineer - Chuyên Viên Triển Khai & Vận Hành AI Agent (Python, N8n, LLM API)',
  'Business Analyst (BRD, User Story, Jira, Azure, SQL)',
  'Associate Business Solution Consultant',
  'Application Consultant (Java, Python, SQL)',
  'CRM (Salesforce/HubSpot) Developer',
  'IT Officer',
  'Kỹ Sư Lập Trình Embedded/IoT (C/C++/C#, Python)',
  'Fullstack Java Developer (Good At English)',
  'Linux System Administrator',
]

describe('isOffTopic', () => {
  it.each(OFF)('hides non-IT posting: %s', (title) => {
    expect(isOffTopic({ title })).toBe(true)
  })
  it.each(IT)('keeps IT posting: %s', (title) => {
    expect(isOffTopic({ title })).toBe(false)
  })
  it('reads the skill tags too', () => {
    expect(isOffTopic({ title: 'Nhân viên kỹ thuật', skills: ['QA/QC', 'Lao động phổ thông'] })).toBe(true)
    expect(isOffTopic({ title: 'Nhân viên kỹ thuật', skills: ['Linux', 'Docker'] })).toBe(false)
  })
})
