# rxjs-sub-manager (rxjs subscription manager)

## 💻 Description

This lib aims to:

-   Manage observable rxjs subscriptions simply and consistently.
-   Avoid memory leaks.
-   Avoid the need to unsubscribe manually.

## 🪟 Preview example

-   [Demo site](https://rxjs-sub-manager.web.app/parent-child)
-   [Demo site source Code](https://github.com/gustavodamazio/rxjs-sub-manager-site.git)

<img src="https://raw.githubusercontent.com/gustavodamazio/rxjs-subscription-manager/main/docs/img/sub-manager-demo-site-screenshoot.png" alt="sub-manager-demo-site-screenshoot" width="400"/>

## 📦 Installation

```bash
$ npm install rxjs-sub-manager
or
$ yarn add rxjs-sub-manager
```

## 🚀 Usage

-   the **examples were made using angular**, however the library is agnostic of any framework it just depends on `rxjs` to work.

### 1. Import the lib

```typescript
import { SubscriptionManager } from 'rxjs-sub-manager';
```

### 2. Create a subscription manager instance

```typescript
export class ParentComponent {
    private readonly subscriptionManager = new SubscriptionManager<string>({
        prefixId: 'ParentComponent-',
    });
}
```

### 3. Subscribe to an observable

```typescript
export class ParentComponent implments OnInit {
    // ...
    private readonly observable1$ = interval(1000);

    ngOnInit() {
        this.subscriptionManager.add(
            'observable1',
            this.observable1$.subscribe((value) => {
                console.log(value);
            })
        );
    }
}
```

### 4. Unsubscribe from an observable triggers

#### 4.1. Unsubscribe from especific observable

```typescript
this.subscriptionManager.close('observable1');
```

#### 4.2. Unsubscribe from all observables

```typescript
this.subscriptionManager.closeAll();
```

### 5. Unsubscribe from all observables when component is destroyed

```typescript
export class ParentComponent implements OnInit, OnDestroy {
    // ...
    ngOnDestroy(): void {
        this.subscriptionManager.destroy();
    }
}
```

### 6. Check observables

```typescript
this.subscriptionManager.hasActive('observable1'); // true
this.subscriptionManager.hasActive('observable2'); // false

this.subscriptionManager.activeSubs$; // Observable<Map<string, SubscriptionManagerRef<string>[]>>;
this.subscriptionManager.activeSubsValue; // Map<string, SubscriptionManagerRef<string>[]>;

this.subscriptionManager.closedSubs$; // Observable<Map<string, SubscriptionManagerRef<string>[]>>;
this.subscriptionManager.closedSubsValue; // Map<string, SubscriptionManagerRef<string>[]>;

this.subscriptionManager.allSubs$; // Observable<{
//    active: Map<string, SubscriptionManagerRef<string>[]>;
//    closed: Map<string, SubscriptionManagerRef<string>[]>;
//}>
```

### 7. check instance ID

```typescript
this.subscriptionManager.instanceId; // string
```

### 8. (Extra) check and control global public context

```typescript
import { SubscriptionManagerPublicContext } from 'rxjs-sub-manager';
export class AppComponent implements OnInit {
    private readonly subscriptionManager = new SubscriptionManager({
        prefixId: 'AppComponent-',
    });
    public readonly rootSubsSize$ = new BehaviorSubject<number>(0); // <-- this is total
    // number of active subscriptions in the app global context
    ngOnInit(): void {
        const sub =
            SubscriptionManagerPublicContext.subscriptionManagerInstances.subscribe(
                (instances) => {
                    this.subscriptionManager.close('rootSubsSize$');
                    const sub = combineLatest(
                        Array.from(instances.values()).map((v) => v.activeSubs$)
                    )
                        .pipe(debounceTime(100))
                        .subscribe((v) => {
                            const size = v.reduce((acc, sm) => {
                                return acc + sm.size;
                            }, 0);
                            this.rootSubsSize$.next(size);
                        });
                    this.subscriptionManager.add({ ref: 'rootSubsSize$', sub });
                }
            );
        this.subscriptionManager.add({
            ref: 'subscriptionManagerInstances$',
            sub,
        });
    }
    ngOnDestroy(): void {
        this.subscriptionManager.destroy();
    }
}
```

## 📝 License

[MIT](LICENSE)

## 👨🏻‍💻 Author

-   Made with ❤️ by [Gustavo Damazio](https://github.com/gustavodamazio)👋🏻
