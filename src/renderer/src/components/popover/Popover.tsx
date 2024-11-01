import { Token, TokenNamespace } from "@renderer/lib/tungsten/token";
import PopoverContent from "./PopoverContent";
import PopoverOverlay from "./PopoverOverlay";
import PopoverTrigger, { PopoverAnchor } from "./PopoverTrigger";
import "./styles.css";
import {
  computePosition,
  ComputePositionReturn,
  flip,
  FlipOptions,
  Middleware,
  offset,
  OffsetOptions,
  Placement,
  shift,
  ShiftOptions,
} from "@floating-ui/dom";
import useControllableState from "@renderer/lib/controllable-state";
import {
  createSignal,
  createContext,
  useContext,
  ParentComponent,
  Accessor,
  createEffect,
  onMount,
  onCleanup,
} from "solid-js";
import { PopoverPortal, PopoverPortalMountStack } from "./PopoverPortal";

export const DEFAULT_POPOVER_OPEN = false;

export type Props = {
  offset?: OffsetOptions;
  flip?: true | FlipOptions;
  shift?: true | ShiftOptions;
  placement?: Placement;
  mousePos?: Accessor<[number, number]>; // [x, y]
  defaultProp?: boolean;
  isOpen?: Accessor<boolean>;
  onValueChange?: (newOpen: boolean) => void;
};

export const [popoverStack, setPopoverStack] = createSignal<Token[]>([]);
const stackIds = new TokenNamespace();

export type Context = ReturnType<typeof useProviderValue>;

function useProviderValue(props: Props) {
  let resizeObserver: ResizeObserver | undefined;

  const [isOpen, setIsOpen] = useControllableState<boolean>({
    defaultProp: props.defaultProp || DEFAULT_POPOVER_OPEN,
    onChange: props.onValueChange,
    prop: props.isOpen,
  });

  const [position, setPosition] = createSignal<ComputePositionReturn | null>(null);
  const [triggerRef, _setTriggerRef] = createSignal<HTMLElement | null>(null);
  const [contentRef, _setContentRef] = createSignal<HTMLDivElement | null>(null);
  const [id, setId] = createSignal<string>("");

  onMount(() => {
    onCleanup(() => {
      stackIds.destroy(id());
    });
  });

  createEffect(() => {
    const triggerElement = triggerRef();
    if (!triggerElement) {
      return;
    }

    if (typeof resizeObserver !== "undefined") {
      // Disconnects old resize observer if the trigger was chaneged
      resizeObserver.disconnect();
      resizeObserver = undefined;
    }

    resizeObserver = new ResizeObserver(() => {
      listenResize();
    });

    resizeObserver.observe(triggerElement);
  });

  const setTriggerRef = (element: HTMLElement) => {
    _setTriggerRef(element);
    listenResize();
  };

  const setContentRef = (element: HTMLDivElement) => {
    _setContentRef(element);
    listenResize();
  };

  let lastMousePos: [number, number];
  const useCustomCoords = {
    name: "useCustomCoords",
    fn() {
      if (
        props.mousePos !== undefined &&
        props.mousePos() !== lastMousePos &&
        props.mousePos()[0] !== 0 &&
        props.mousePos()[1] !== 0
      ) {
        lastMousePos = props.mousePos();
        return { x: lastMousePos[0], y: lastMousePos[1] };
      }
      return {};
    },
  };

  const listenResize = () => {
    const trigger = triggerRef();
    const content = contentRef();

    if (!trigger || !content) {
      return;
    }

    const middleware: Middleware[] = [offset(props.offset)];
    if (typeof props.shift !== "undefined") {
      middleware.push(shift(props.shift === true ? undefined : props.shift));
    }
    if (typeof props.flip !== "undefined") {
      middleware.push(flip(props.flip === true ? undefined : props.flip));
    }
    if (typeof props.mousePos !== "undefined") {
      middleware.push(useCustomCoords);
    }

    computePosition(trigger, content, {
      placement: props.placement,
      strategy: "fixed",
      middleware,
    }).then(setPosition);
  };

  createEffect(() => {
    if (isOpen()) {
      const newId = stackIds.create();
      setPopoverStack((p) => [...p, newId]);
      setId(newId);
    } else {
      setPopoverStack((p) => p.filter((popoverId) => popoverId !== id()));
      setId("");
    }
  });

  return {
    id,
    isOpen,
    open: () => {
      setIsOpen(true);
    },
    close: () => {
      setIsOpen(false);
    },
    toggle: () => setIsOpen((o) => !o),
    position,
    setPosition,
    triggerRef,
    setTriggerRef,
    setContentRef,
    contentRef,
  };
}

export const PopoverContext = createContext<Context>();

export const PopoverRoot: ParentComponent<Props> = (props) => {
  const state = useProviderValue(props);
  return <PopoverContext.Provider value={state}>{props.children}</PopoverContext.Provider>;
};

export function usePopover(): Context {
  const state = useContext(PopoverContext);
  if (!state) {
    throw new Error("usePopover needs to be used inisde of the `Popover` component.");
  }
  return state;
}

const Popover = Object.assign(PopoverRoot, {
  Portal: PopoverPortal,
  PortalMountStack: PopoverPortalMountStack,
  Content: PopoverContent,
  Trigger: PopoverTrigger,
  Anchor: PopoverAnchor,
  Overlay: PopoverOverlay,
});

export default Popover;
