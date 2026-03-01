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
    birthYear?: number;
    deathYear?: number;
};

export type TreeFamily = {
    handle: string;
    fatherHandle?: string;
    motherHandle?: string;
    children: string[];
};

export type PositionedNode = TreeNode & { node: TreeNode; x: number; y: number };
export type PositionedCouple = {
    id: string;
    familyHandle: string;
    fatherPos?: PositionedNode;
    motherPos?: PositionedNode;
    midX: number;
    y: number;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
};
export type Connection = { fromX: number; fromY: number; toX: number; toY: number; type: 'parent' | 'couple' };

export type LayoutResult = {
    nodes: PositionedNode[];
    connections: Connection[];
    couples: PositionedCouple[];
    width: number;
    height: number;
};

export const CARD_W = 180;
export const CARD_H = 96;

export function computeLayout(people: TreeNode[], families: TreeFamily[]): LayoutResult {
    const nodes = people.map((p, i) => ({
        ...p,
        node: p,
        x: (i % 5) * (CARD_W + 20),
        y: Math.floor(i / 5) * (CARD_H + 40),
    }));
    const maxX = nodes.reduce((max, n) => Math.max(max, n.x), 0);
    const maxY = nodes.reduce((max, n) => Math.max(max, n.y), 0);
    return {
        nodes,
        connections: [],
        couples: [],
        width: nodes.length ? maxX + CARD_W : 0,
        height: nodes.length ? maxY + CARD_H : 0,
    };
}

export function filterAncestors(handle: string, people: TreeNode[], families: TreeFamily[]) {
    return { people, families, focusHandle: handle };
}

export function filterDescendants(handle: string, people: TreeNode[], families: TreeFamily[]) {
    return { people, families, focusHandle: handle };
}
