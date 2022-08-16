import { BehaviorSubject, Observable } from 'rxjs';
import { SubscriptionManager } from './SubscriptionManager';

export abstract class SubscriptionManagerRootContext {
    public static readonly subscriptionManagerInstances: BehaviorSubject<
        Map<string, SubscriptionManager<string>>
    > = new BehaviorSubject(new Map());

    public static addInstance(instance: SubscriptionManager<any>) {
        const subscriptionManagerInstancesMap =
            SubscriptionManagerRootContext.subscriptionManagerInstances.getValue();
        subscriptionManagerInstancesMap.set(instance.instanceId, instance);
        SubscriptionManagerRootContext.subscriptionManagerInstances.next(
            subscriptionManagerInstancesMap
        );
    }
    public static removeInstance(instanceId: string) {
        const subscriptionManagerInstancesMap =
            SubscriptionManagerRootContext.subscriptionManagerInstances.getValue();
        subscriptionManagerInstancesMap.delete(instanceId);
        SubscriptionManagerRootContext.subscriptionManagerInstances.next(
            subscriptionManagerInstancesMap
        );
    }
}

export abstract class SubscriptionManagerPublicContext {
    public static readonly subscriptionManagerInstances: Observable<
        Map<string, SubscriptionManager<string>>
    > =
        SubscriptionManagerRootContext.subscriptionManagerInstances.asObservable();
}
