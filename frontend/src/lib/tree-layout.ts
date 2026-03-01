export type TreeNode = {
    handle: string;
    displayName: string;
    gender: number;
    generation: number;
    isLiving: boolean;
    isPrivacyFiltered: boolean;
    isPatrilineal: boolean;
    families: string[];
    parentFamilies: string[];
};

export type TreeFamily = {
    handle: string;
    fatherHandle?: string;
    motherHandle?: string;
    children: string[];
};

export type PositionedNode = TreeNode & { x: number; y: number };
export type PositionedCouple = { id: string; fromX: number; fromY: number; toX: number; toY: number };
export type Connection = { fromX: number; fromY: number; toX: number; toY: number; type: 'parent' | 'couple' };

export type LayoutResult = {
    nodes: PositionedNode[];
    connections: Connection[];
    couples: PositionedCouple[];
};

export const CARD_W = 180;
export const CARD_H = 96;

export function computeLayout(people: TreeNode[], families: TreeFamily[]): LayoutResult {
    const nodes = people.map((p, i) => ({
        ...p,
        x: (i % 5) * (CARD_W + 20),
        y: Math.floor(i / 5) * (CARD_H + 40),
    }));
    return { nodes, connections: [], couples: [] };
}

export function filterAncestors(people: TreeNode[], families: TreeFamily[], _handle: string) {
    return { people, families };
}

export function filterDescendants(people: TreeNode[], families: TreeFamily[], _handle: string) {
    return { people, families };
}
