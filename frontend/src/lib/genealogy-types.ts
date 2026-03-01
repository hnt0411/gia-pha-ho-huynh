export type PersonDetail = {
    handle: string;
    displayName: string;
    gender: number;
    generation: number;
    isLiving: boolean;
    isPrivacyFiltered: boolean;
    isPatrilineal: boolean;
    families: string[];
    parentFamilies: string[];
    surname?: string;
    firstName?: string;
    nickName?: string;
    birthDate?: string;
    birthPlace?: string;
    deathDate?: string;
    deathPlace?: string;
    birthYear?: number;
    deathYear?: number;
    phone?: string;
    email?: string;
    currentAddress?: string;
    hometown?: string;
    occupation?: string;
    company?: string;
    education?: string;
    notes?: string;
    biography?: string;
    tags?: string[];
    mediaCount?: number;
    chi?: number;
    zalo?: string;
    facebook?: string;
    _privacyNote?: string;
};

export function zodiacYear(year?: number) {
    if (!year) return '';
    const animals = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
    return animals[year % 12];
}
