"use client";
import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { UserPlus, Search, Filter, MoreVertical, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/admin/users?role=student');
      setStudents(response.data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setError('Không tải được danh sách sinh viên. Vui lòng kiểm tra backend đang chạy.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Quản lý sinh viên</h1>
        <button className="glass" style={{ 
          padding: '0.75rem 1.5rem', 
          borderRadius: 'var(--radius)', 
          background: 'var(--primary)', 
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600
        }}>
          <UserPlus size={18} />
          Thêm sinh viên
        </button>
      </div>

      <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius)', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input 
              type="text" 
              placeholder="Tìm kiếm sinh viên..."
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem 0.75rem 2.5rem', 
                borderRadius: 'var(--radius)', 
                border: '1px solid var(--border)',
                background: 'var(--background)'
              }} 
            />
          </div>
          <button className="glass" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <Filter size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#991b1b' }}>
          {error}
        </div>
      ) : (
        <Card title={`Tổng số sinh viên (${students.length})`}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>Mã SV</th>
                <th style={{ padding: '1rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>Họ tên</th>
                <th style={{ padding: '1rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>Email</th>
                <th style={{ padding: '1rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>Vai trò</th>
                <th style={{ padding: '1rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{student._id.substring(0, 8)}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{student.full_name || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>{student.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '99px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      background: '#dcfce7',
                      color: '#166534'
                    }}>
                      {student.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
