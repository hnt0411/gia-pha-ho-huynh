import { supabase } from './supabase';
import type { TreeNode, TreeFamily } from './tree-layout';

export async function fetchTreeData(): Promise<{ people: TreeNode[]; families: TreeFamily[] }> {
    try {
        const [peopleRes, familiesRes] = await Promise.all([
            supabase.from('people').select('*'),
            supabase.from('families').select('*'),
        ]);
        const people = (peopleRes.data || []).map((row) => ({
            handle: row.handle as string,
            displayName: row.display_name as string,
            gender: row.gender as number,
            generation: row.generation as number,
            isLiving: row.is_living as boolean,
            isPrivacyFiltered: row.is_privacy_filtered as boolean,
            isPatrilineal: row.is_patrilineal as boolean,
            families: (row.families as string[]) || [],
            parentFamilies: (row.parent_families as string[]) || [],
            birthYear: row.birth_year as number | undefined,
            deathYear: row.death_year as number | undefined,
        }));
        const families = (familiesRes.data || []).map((row) => ({
            handle: row.handle as string,
            fatherHandle: row.father_handle as string | undefined,
            motherHandle: row.mother_handle as string | undefined,
            children: (row.children as string[]) || [],
        }));
        return { people, families };
    } catch {
        return { people: [], families: [] };
    }
}

export async function updateFamilyChildren(familyHandle: string, newChildrenOrder: string[]): Promise<void> {
    await supabase.from('families').update({ children: newChildrenOrder }).eq('handle', familyHandle);
}

export async function moveChildToFamily(
    _childHandle: string,
    _fromFamily: string,
    _toFamily: string,
    _families: TreeFamily[],
): Promise<void> {
    return;
}

export async function removeChildFromFamily(
    _childHandle: string,
    _familyHandle: string,
    _families: TreeFamily[],
): Promise<void> {
    return;
}

export async function updatePersonLiving(handle: string, isLiving: boolean): Promise<void> {
    await supabase.from('people').update({ is_living: isLiving }).eq('handle', handle);
}

export async function updatePerson(handle: string, fields: Record<string, unknown>): Promise<void> {
    await supabase.from('people').update(fields).eq('handle', handle);
}
