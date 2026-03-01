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
    const H_GAP = 48;
    const V_GAP = 120;
    const orderMap = new Map<string, { familyIndex: number; childIndex: number; name: string }>();
    families.forEach((f, i) => {
        if (f.fatherHandle) {
            const prev = orderMap.get(f.fatherHandle);
            if (!prev || i < prev.familyIndex || (i === prev.familyIndex && -1 < prev.childIndex)) {
                orderMap.set(f.fatherHandle, { familyIndex: i, childIndex: -1, name: '' });
            }
        }
        if (f.motherHandle) {
            const prev = orderMap.get(f.motherHandle);
            if (!prev || i < prev.familyIndex || (i === prev.familyIndex && -1 < prev.childIndex)) {
                orderMap.set(f.motherHandle, { familyIndex: i, childIndex: -1, name: '' });
            }
        }
        f.children.forEach((ch, idx) => {
            const prev = orderMap.get(ch);
            if (!prev || i < prev.familyIndex || (i === prev.familyIndex && idx < prev.childIndex)) {
                orderMap.set(ch, { familyIndex: i, childIndex: idx, name: '' });
            }
        });
    });

    const genMap = new Map<number, TreeNode[]>();
    for (const p of people) {
        if (!genMap.has(p.generation)) genMap.set(p.generation, []);
        genMap.get(p.generation)!.push(p);
    }

    const sortedGens = Array.from(genMap.keys()).sort((a, b) => a - b);
    const nodes: PositionedNode[] = [];
    let maxX = 0;
    let maxY = 0;

    for (const gen of sortedGens) {
        const row = genMap.get(gen)!;
        row.sort((a, b) => {
            const oa = orderMap.get(a.handle) ?? { familyIndex: Number.MAX_SAFE_INTEGER, childIndex: Number.MAX_SAFE_INTEGER, name: a.displayName };
            const ob = orderMap.get(b.handle) ?? { familyIndex: Number.MAX_SAFE_INTEGER, childIndex: Number.MAX_SAFE_INTEGER, name: b.displayName };
            if (oa.familyIndex !== ob.familyIndex) return oa.familyIndex - ob.familyIndex;
            if (oa.childIndex !== ob.childIndex) return oa.childIndex - ob.childIndex;
            return a.displayName.localeCompare(b.displayName);
        });

        row.forEach((p, i) => {
            const x = i * (CARD_W + H_GAP);
            const y = gen * (CARD_H + V_GAP);
            nodes.push({ ...p, node: p, x, y });
            maxX = Math.max(maxX, x + CARD_W);
            maxY = Math.max(maxY, y + CARD_H);
        });
    }

    const nodeMap = new Map(nodes.map(n => [n.handle, n]));
    const connections: Connection[] = [];
    const couples: PositionedCouple[] = [];

    const centerX = (n: PositionedNode) => n.x + CARD_W / 2;
    const centerY = (n: PositionedNode) => n.y + CARD_H / 2;

    for (const f of families) {
        const fatherPos = f.fatherHandle ? nodeMap.get(f.fatherHandle) : undefined;
        const motherPos = f.motherHandle ? nodeMap.get(f.motherHandle) : undefined;
        let parentCenterX: number | null = null;
        let parentBottomY: number | null = null;
        if (fatherPos && motherPos) {
            const fx = centerX(fatherPos);
            const fy = centerY(fatherPos);
            const mx = centerX(motherPos);
            const my = centerY(motherPos);
            connections.push({ fromX: fx, fromY: fy, toX: mx, toY: my, type: 'couple' });
            const midX = (fx + mx) / 2;
            const y = Math.min(fatherPos.y, motherPos.y);
            couples.push({
                id: f.handle,
                familyHandle: f.handle,
                fatherPos,
                motherPos,
                midX,
                y,
                fromX: fx,
                fromY: fy,
                toX: mx,
                toY: my,
            });
            parentCenterX = midX;
            parentBottomY = Math.max(fatherPos.y, motherPos.y) + CARD_H;
        } else if (fatherPos || motherPos) {
            const p = fatherPos ?? motherPos!;
            parentCenterX = centerX(p);
            parentBottomY = p.y + CARD_H;
        }

        if (parentCenterX !== null && parentBottomY !== null) {
            for (const ch of f.children) {
                const childPos = nodeMap.get(ch);
                if (!childPos) continue;
                const childCenterX = centerX(childPos);
                const childTopY = childPos.y;
                const midY = (parentBottomY + childTopY) / 2;
                connections.push({ fromX: parentCenterX, fromY: parentBottomY, toX: parentCenterX, toY: midY, type: 'parent' });
                connections.push({ fromX: parentCenterX, fromY: midY, toX: childCenterX, toY: midY, type: 'parent' });
                connections.push({ fromX: childCenterX, fromY: midY, toX: childCenterX, toY: childTopY, type: 'parent' });
            }
        }
    }
    return {
        nodes,
        connections,
        couples,
        width: nodes.length ? maxX : 0,
        height: nodes.length ? maxY : 0,
    };
}

export function filterAncestors(handle: string, people: TreeNode[], families: TreeFamily[]) {
    return { people, families, focusHandle: handle };
}

export function filterDescendants(handle: string, people: TreeNode[], families: TreeFamily[]) {
    return { people, families, focusHandle: handle };
}
