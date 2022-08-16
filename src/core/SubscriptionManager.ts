import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { SubscriptionManagerRootContext } from './SubscriptionManagerContext';

type ConstructorSubscriptionManagerRef<CSMR_RefKeyString> = Omit<
    SubscriptionManagerRef<CSMR_RefKeyString>,
    'open_time' | 'close_time' | 'unsubscribe'
>;

export class SubscriptionManagerRef<SMR_RefKeyString> {
    ref: SMR_RefKeyString;
    sub: Subscription;
    open_time: Date;
    close_time: Date;
    constructor({
        ref,
        sub,
    }: ConstructorSubscriptionManagerRef<SMR_RefKeyString>) {
        this.ref = ref;
        this.sub = sub;
        this.open_time = new Date();
        this.close_time = null;
    }
    public unsubscribe() {
        this.sub.unsubscribe();
        this.close_time = new Date();
    }
}

export class SubscriptionManager<RefKeyString> {
    public readonly instanceId = uuidv4();
    private readonly activeSubs = new BehaviorSubject<
        Map<RefKeyString, SubscriptionManagerRef<RefKeyString>[]>
    >(new Map());
    private readonly closedSubs = new BehaviorSubject<
        Map<RefKeyString, SubscriptionManagerRef<RefKeyString>[]>
    >(new Map());

    constructor() {
        SubscriptionManagerRootContext.addInstance(this);
    }

    public add({
        ref,
        sub,
    }: ConstructorSubscriptionManagerRef<RefKeyString>): void {
        const activeSubsMap = this.activeSubs.getValue();
        const subsKeyMapGet = activeSubsMap.get(ref) ?? [];
        if (subsKeyMapGet.length > 0) {
            console.warn(
                'Registration with the same duplicate reference, be careful.',
                { duplicate: subsKeyMapGet }
            );
        }
        this.activeSubs.next(
            activeSubsMap.set(
                ref,
                subsKeyMapGet.concat([new SubscriptionManagerRef({ ref, sub })])
            )
        );
    }

    public close(ref: RefKeyString | RefKeyString[]): void {
        const activeSubsMap = this.activeSubs.getValue();
        const closedSubsMap = this.closedSubs.getValue();
        const refs: RefKeyString[] = Array.isArray(ref) ? ref : [ref];
        for (const refKeyString of refs) {
            const activeSubs = activeSubsMap.get(refKeyString) ?? [];
            for (const activeSub of activeSubs) {
                activeSub.unsubscribe();
            }
            const closedSubs = activeSubsMap.get(refKeyString) ?? [];
            activeSubsMap.delete(refKeyString);
            closedSubsMap.set(refKeyString, closedSubs.concat(activeSubs));
        }
        this.closedSubs.next(closedSubsMap);
    }

    public closeAll(): void {
        const activeSubsMap = this.activeSubs.getValue();
        const closedSubsMap = this.closedSubs.getValue();
        activeSubsMap.forEach(([smr]) => smr.unsubscribe());
        for (const [refKeyString, iterator] of Array.from(
            activeSubsMap.entries()
        )) {
            const closedSubs = activeSubsMap.get(refKeyString) ?? [];
            closedSubsMap.set(refKeyString, closedSubs.concat(iterator));
        }
        this.closedSubs.next(closedSubsMap);
        this.activeSubs.next(new Map());
    }

    public destroy(): void {
        this.closeAll();
        SubscriptionManagerRootContext.removeInstance(this.instanceId);
    }

    public hasActive(ref: RefKeyString): boolean {
        return this.activeSubs.getValue().has(ref);
    }

    public get activeSubs$(): Observable<
        Map<RefKeyString, SubscriptionManagerRef<RefKeyString>[]>
    > {
        return this.activeSubs.asObservable();
    }

    public get closedSubs$(): Observable<
        Map<RefKeyString, SubscriptionManagerRef<RefKeyString>[]>
    > {
        return this.closedSubs.asObservable();
    }

    public get allSubs$(): Observable<{
        active: Map<RefKeyString, SubscriptionManagerRef<RefKeyString>[]>;
        closed: Map<RefKeyString, SubscriptionManagerRef<RefKeyString>[]>;
    }> {
        return combineLatest([this.activeSubs$, this.closedSubs$]).pipe(
            map(([active, closed]) => ({ active, closed }))
        );
    }
}
