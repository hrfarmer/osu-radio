import { ParentComponent } from "solid-js";
import List from "../list/List";
import Popover from "../popover/Popover";
import { Props as ListProps } from "../list/List";
import { Portal } from "solid-js/web";

const DropdownList: ParentComponent<ListProps> = (props) => {
  return (
    <Portal>
      <Popover.Overlay />
      <Popover.Content class="dropdown-list">
        <List {...props} />
      </Popover.Content>
    </Portal>
  );
};

export default DropdownList;
