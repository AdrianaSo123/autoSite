// Lightweight in-memory session proxy to track post results

export interface PostResultSubset {
    title: string;
    slug: string;
    date: string;
}

export const sessionState = {
    lastPostResults: [] as PostResultSubset[]
};
