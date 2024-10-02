export enum Purpose { Tile, Detail, Paint };

export interface EntityModel {
    id: string;
    tick: number;
    position: number;
}

export default abstract class EntityObject<T> {
    abstract getPosition(): number;
    abstract getID(): String;
    abstract getAge(): number;
    abstract tick(): void;

    abstract toModel(): T;
}