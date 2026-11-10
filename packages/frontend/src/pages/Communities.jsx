import AddCommunity from "../components/communities/AddCommunity";
import { DiscoverableCommunities } from "../components/communities/DiscoverCommunities";
import { MyCommunities } from "../components/communities/MyCommunities";
import PageHeader from "../components/ui/PageHeader";
import { IconUsers } from "../components/ui/icons";

function Communities() {
  return (
    <div>
      <PageHeader
        title="Communities"
        subtitle="Find groups to play with, or start your own."
        icon={<IconUsers className="size-8" />}
      />

      {/* On wide screens the communities to join fill the left and
          yours sit on the right. Narrower, everything stacks */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <DiscoverableCommunities />

        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 lg:grid-cols-1">
          <AddCommunity />
          <MyCommunities />
        </div>
      </div>
    </div>
  );
}

export default Communities;
