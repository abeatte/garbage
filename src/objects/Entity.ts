export enum Purpose { Tile, Detail, Paint };

export interface EntityModel {
    id: string;
    tick: number;
    position: number;
}

export default abstract class Entity<T> {
    abstract getPosition(): number;
    abstract getID(): String;
    abstract getAge(): number;
    abstract tick(): void;

    abstract toModel(): T;
}