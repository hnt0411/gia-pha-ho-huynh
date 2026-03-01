-- ============================================================
-- 🌳 Gia Phả Điện Tử — Database Setup
-- ============================================================
-- Chạy file này trong: Supabase Dashboard → SQL Editor
-- File này tạo toàn bộ cấu trúc database + dữ liệu mẫu demo
-- ============================================================


-- ╔══════════════════════════════════════════════════════════╗
-- ║  1. CORE TABLES: people + families                      ║
-- ╚══════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS people (
    handle TEXT PRIMARY KEY,
    gramps_id TEXT,
    gender INT NOT NULL DEFAULT 1,           -- 1=Nam, 2=Nữ
    display_name TEXT NOT NULL,
    surname TEXT,
    first_name TEXT,
    generation INT DEFAULT 1,
    chi INT,
    birth_year INT,
    birth_date TEXT,
    birth_place TEXT,
    death_year INT,
    death_date TEXT,
    death_place TEXT,
    is_living BOOLEAN DEFAULT true,
    is_privacy_filtered BOOLEAN DEFAULT false,
    is_patrilineal BOOLEAN DEFAULT true,     -- true=chính tộc, false=ngoại tộc
    families TEXT[] DEFAULT '{}',            -- family handles where this person is parent
    parent_families TEXT[] DEFAULT '{}',     -- family handles where this person is child
    phone TEXT,
    email TEXT,
    zalo TEXT,
    facebook TEXT,
    current_address TEXT,
    hometown TEXT,
    occupation TEXT,
    company TEXT,
    education TEXT,
    nick_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS families (
    handle TEXT PRIMARY KEY,
    father_handle TEXT,
    mother_handle TEXT,
    children TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_people_generation ON people (generation);
CREATE INDEX IF NOT EXISTS idx_people_surname ON people (surname);
CREATE INDEX IF NOT EXISTS idx_families_father ON families (father_handle);
CREATE INDEX IF NOT EXISTS idx_families_mother ON families (mother_handle);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS people_updated_at ON people;
CREATE TRIGGER people_updated_at BEFORE UPDATE ON people
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS families_updated_at ON families;
CREATE TRIGGER families_updated_at BEFORE UPDATE ON families
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ╔══════════════════════════════════════════════════════════╗
-- ║  2. AUTH: profiles + auto-create trigger                ║
-- ╚══════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    person_handle TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended'));
UPDATE profiles SET status = 'active' WHERE status IS NULL;

CREATE TABLE IF NOT EXISTS error_logs (
    id SERIAL PRIMARY KEY,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
-- ⚠️ ĐỔI EMAIL ADMIN: thay 'your-admin@example.com' bằng email admin thật
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_email TEXT;
    user_display_name TEXT;
BEGIN
    user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', '');
    user_display_name := NEW.raw_user_meta_data->>'display_name';

    IF user_email != '' THEN
        INSERT INTO public.profiles (id, email, display_name, role, status)
        VALUES (
            NEW.id,
            user_email,
            user_display_name,
            CASE WHEN user_email = 'huynhnhattien0411@gmail.com' THEN 'admin' ELSE 'viewer' END,
            'active'
        )
        ON CONFLICT (email) DO UPDATE SET id = NEW.id, display_name = user_display_name;
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.error_logs (error_message) VALUES ('handle_new_user: ' || SQLERRM);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ╔══════════════════════════════════════════════════════════╗
-- ║  3. CONTRIBUTIONS (đề xuất chỉnh sửa)                  ║
-- ╚══════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_email TEXT,
    person_handle TEXT NOT NULL,
    person_name TEXT,
    field_name TEXT NOT NULL,
    field_label TEXT,
    old_value TEXT,
    new_value TEXT NOT NULL,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_note TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);
CREATE INDEX IF NOT EXISTS idx_contributions_person ON contributions(person_handle);


-- ╔══════════════════════════════════════════════════════════╗
-- ║  4. COMMENTS (bình luận)                                ║
-- ╚══════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author_email TEXT,
    author_name TEXT,
    person_handle TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_person ON comments(person_handle);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    body TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);


-- ╔══════════════════════════════════════════════════════════╗
-- ║  5. ROW LEVEL SECURITY (RLS)                            ║
-- ╚══════════════════════════════════════════════════════════╝

-- People & Families: public read, authenticated write, admin delete
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read people" ON people;
CREATE POLICY "anyone can read people" ON people FOR SELECT USING (true);

DROP POLICY IF EXISTS "anyone can read families" ON families;
CREATE POLICY "anyone can read families" ON families FOR SELECT USING (true);

DROP POLICY IF EXISTS "authenticated can update people" ON people;
CREATE POLICY "authenticated can update people" ON people
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "authenticated can insert people" ON people;
CREATE POLICY "authenticated can insert people" ON people
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin can delete people" ON people;
CREATE POLICY "admin can delete people" ON people
    FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "authenticated can update families" ON families;
CREATE POLICY "authenticated can update families" ON families
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "authenticated can insert families" ON families;
CREATE POLICY "authenticated can insert families" ON families
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin can delete families" ON families;
CREATE POLICY "admin can delete families" ON families
    FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Profiles: public read, update own or admin
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read profiles" ON profiles;
CREATE POLICY "anyone can read profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "users can insert own profile" ON profiles;
CREATE POLICY "users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users or admin can update profile" ON profiles;
CREATE POLICY "users or admin can update profile" ON profiles
    FOR UPDATE USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Contributions: public read, user insert own, admin update
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read contributions" ON contributions;
CREATE POLICY "anyone can read contributions" ON contributions FOR SELECT USING (true);

DROP POLICY IF EXISTS "users can insert contributions" ON contributions;
CREATE POLICY "users can insert contributions" ON contributions FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "admin can update contributions" ON contributions;
CREATE POLICY "admin can update contributions" ON contributions
    FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Comments: public read, user insert own, owner/admin delete
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can read comments" ON comments;
CREATE POLICY "anyone can read comments" ON comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "users can insert comments" ON comments;
CREATE POLICY "users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "owner or admin can delete comments" ON comments;
CREATE POLICY "owner or admin can delete comments" ON comments
    FOR DELETE USING (
        author_id = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can read notifications" ON notifications;
CREATE POLICY "users can read notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users can update notifications" ON notifications;
CREATE POLICY "users can update notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users can insert notifications" ON notifications;
CREATE POLICY "users can insert notifications" ON notifications
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Constraints
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_content_length;
ALTER TABLE comments ADD CONSTRAINT comments_content_length CHECK (char_length(content) BETWEEN 1 AND 2000);

ALTER TABLE contributions DROP CONSTRAINT IF EXISTS contributions_value_length;
ALTER TABLE contributions ADD CONSTRAINT contributions_value_length CHECK (char_length(new_value) <= 5000);


-- ╔══════════════════════════════════════════════════════════╗
-- ║  6. DỮ LIỆU GIA PHẢ HỌ HUỲNH                             ║
-- ╚══════════════════════════════════════════════════════════╝

DELETE FROM families;
DELETE FROM people;

-- People
INSERT INTO people (handle, display_name, gender, generation, birth_year, birth_date, death_year, is_living, is_patrilineal, families, parent_families) VALUES
-- Đời 1
('P001', 'Huỳnh Ngọc Ánh',    1, 1, 1950, '10/10/1950', NULL, true, true, '{"F001"}', '{}'),
('P002', 'Hoàng Thị Mỹ Liên', 2, 1, 1952, '08/02/1952', NULL, true, false, '{"F001"}', '{}'),
-- Đời 2
('P003', 'Huỳnh Huy Hoàng',    1, 2, 1973, '27/07/1973', NULL, true, true, '{}', '{"F001"}'),
('P004', 'Huỳnh Thị Tường Vân', 2, 2, 1975, '04/08/1975', NULL, true, true, '{}', '{"F001"}'),
('P005', 'Huỳnh Tiến Dũng',    1, 2, 1978, '26/01/1978', NULL, true, true, '{}', '{"F001"}'),
('P006', 'Huỳnh Tiến Sỹ',      1, 2, 1981, '02/02/1981', NULL, true, true, '{}', '{"F001"}'),
('P007', 'Huỳnh Ngọc Đạt',    1, 2, 1983, '17/03/1983', NULL, true, true, '{}', '{"F001"}'),
-- Vợ/Chồng của Đời 2
('P008', 'Nguyễn Thị Ngọc Hà', 2, 2, 1973, '24/10/1973', NULL, true, false, '{"F002"}', '{}'),
('P011', 'Cao Bửu Tuấn',       1, 2, 1971, '08/06/1971', NULL, true, false, '{"F003"}', '{}'),
('P014', 'Đặng Mỹ Chi',        2, 2, 1977, '18/09/1977', NULL, true, false, '{"F004"}', '{}'),
('P017', 'Nguyễn Thị Hiền',    2, 2, 1982, '20/04/1982', NULL, true, false, '{"F005"}', '{}'),
('P020', 'Nguyễn Thị Thu Trang',2, 2, 1985, '10/06/1985', NULL, true, false, '{"F006"}', '{}'),
-- Đời 3
('P009', 'Huỳnh Huy Hảo',      1, 3, 1999, '28/10/1999', NULL, true, true, '{}', '{"F002"}'),
('P010', 'Huỳnh Bảo Hân',      2, 3, 2004, '11/12/2004', NULL, true, true, '{}', '{"F002"}'),
('P012', 'Cao Đại Nghĩa',      1, 3, 2001, '08/09/2001', NULL, true, false, '{}', '{"F003"}'),
('P013', 'Cao Vĩnh Lợi',       1, 3, 2007, '13/09/2007', NULL, true, false, '{}', '{"F003"}'),
('P015', 'Huỳnh Nhật Tiến',    1, 3, 2005, '04/11/2005', NULL, true, true, '{}', '{"F004"}'),
('P016', 'Huỳnh Nhật Minh',    1, 3, 2014, '18/08/2014', NULL, true, true, '{}', '{"F004"}'),
('P018', 'Huỳnh Phương Thảo',  2, 3, 2010, '30/01/2010', NULL, true, true, '{}', '{"F005"}'),
('P019', 'Huỳnh Phương Nam',   1, 3, 2015, '07/05/2015', NULL, true, true, '{}', '{"F005"}'),
('P021', 'Huỳnh Hữu Bằng',     1, 3, 2015, '20/11/2015', NULL, true, true, '{}', '{"F006"}'),
('P022', 'Huỳnh Hà My',        2, 3, 2020, '10/02/2020', NULL, true, true, '{}', '{"F006"}')
ON CONFLICT (handle) DO NOTHING;

-- Families
INSERT INTO families (handle, father_handle, mother_handle, children) VALUES
('F001', 'P001', 'P002', '{"P003","P004","P005","P006","P007"}'),
('F002', 'P003', 'P008', '{"P009", "P010"}'),
('F003', 'P011', 'P004', '{"P012", "P013"}'),
('F004', 'P005', 'P014', '{"P015", "P016"}'),
('F005', 'P006', 'P017', '{"P018", "P019"}'),
('F006', 'P007', 'P020', '{"P021", "P022"}')
ON CONFLICT (handle) DO NOTHING;

-- Cập nhật lại Đời 2 để liên kết với gia đình mới
UPDATE people SET families = array_append(families, 'F002') WHERE handle = 'P003';
UPDATE people SET families = array_append(families, 'F003') WHERE handle = 'P004';
UPDATE people SET families = array_append(families, 'F004') WHERE handle = 'P005';
UPDATE people SET families = array_append(families, 'F005') WHERE handle = 'P006';
UPDATE people SET families = array_append(families, 'F006') WHERE handle = 'P007';


-- ============================================================
SELECT '✅ Database setup complete! Demo data loaded.' AS status;
-- ============================================================
