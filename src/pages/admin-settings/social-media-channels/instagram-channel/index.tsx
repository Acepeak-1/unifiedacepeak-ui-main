import { InstagramLineIcon } from '@/assets/icons';
import ChannelCard from '../channel-card';
import { DEMO_CHANNELS } from '../constants';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { connectMetaChannel, handleAlert } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSocialMediaChannelList, changeOmniStatus, deleteOmniChannel } from '@/services/api';
import { Trash2 } from 'lucide-react';

import { useUser } from '@/hooks/use-user';

const InstagramChannel = () => {
  const [isInstagramModalOpen, setIsInstagramModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const queryClient = useQueryClient();

  const { data: channelList = [], isLoading: isLodingChannelList } = useQuery({
    queryKey: ['getSocialMediaChannelList'],
    queryFn: () => getSocialMediaChannelList(),
    select: (data) => data?.data?.data?.result || [],
  });

  const { mutate: mutateStatusChange } = useMutation({
    mutationFn: changeOmniStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getSocialMediaChannelList'] });
    },
  });

  const { mutate: mutateDeleteChannel, isPending: isDeleting } = useMutation({
    mutationFn: deleteOmniChannel,
    onSuccess: () => {
      handleAlert({ text: 'Channel deleted successfully!', type: 'success' });
      setIsDeleteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['getSocialMediaChannelList'] });
    },
    onError: (error: any) => {
      handleAlert({
        text: error?.response?.data?.message || 'Failed to delete channel',
        type: 'error',
      });
    },
  });

  const instagramData =
    channelList &&
    channelList?.find((item: { name: string; type: string }) => item?.type === 'instagram');

  const isInstagramConnected = !!instagramData;
  console.log(isInstagramConnected, 'isInstagramConnected', channelList, instagramData);

  const handleConnect = () => {
    connectMetaChannel('instagram', setLoading, user?.company_info?.uuid);
  };

  return (
    <div>
      <ChannelCard
        icon={<InstagramLineIcon className="w-6 h-6" />}
        tone="instagram"
        name="Instagram"
        description="Handle direct messages, comments and story replies from your Instagram Business account."
        /* DEMO fallback — remove with DEMO_CHANNELS before release. */
        isConnected={isInstagramConnected || DEMO_CHANNELS.instagram.connected}
        account={DEMO_CHANNELS.instagram.account}
        capabilities={DEMO_CHANNELS.instagram.capabilities}
        isLoading={isLodingChannelList}
        onConnect={() => setIsInstagramModalOpen(true)}
        onManage={handleConnect}
        onDelete={() => setIsDeleteModalOpen(true)}
        switchChecked={instagramData ? instagramData.status === 1 : Boolean(DEMO_CHANNELS.instagram.enabled)}
        onSwitchChange={(checked) => {
          if (instagramData?.uuid) {
            mutateStatusChange({ uuid: instagramData.uuid, status: checked ? 1 : 0 });
          }
        }}
      />

      <Dialog open={isInstagramModalOpen} onOpenChange={setIsInstagramModalOpen}>
        <DialogContent className="w-[680px] max-w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-gray-200">
          <div className="p-6 flex flex-col gap-5">
            <DialogHeader className="gap-2 text-left">
              <DialogTitle>Instagram Setup</DialogTitle>
              <DialogDescription>
                Connect your Instagram Business account and set up chat on your page.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-start gap-5">
              <div className="flex flex-col gap-1">
                <h6 className={`font-medium`}>Connect Instagram Pages</h6>
                <p className="text-grey-600 font-medium text-sm leading-relaxed">
                  Connect your Instagram Business account with UCAAS Chat to exchange messages and
                  receive reactions to your Stories. Facebook Messenger is included so you can
                  communicate with your Facebook followers as well.
                </p>
              </div>

              <Button onClick={handleConnect} disabled={loading}>
                {loading ? 'Connecting...' : 'Connect Instagram'}
              </Button>

              <div className="flex flex-col gap-3 border-t border-grey-300 mt-1.5 pt-3 w-full">
                <h6 className={`font-medium`}>Integration Guideline</h6>
                <div className="flex bg-grey flex-col p-3 gap-2">
                  <p>Change your Instagram account from Creator to Business</p>
                  <a href="javascript:void(0)" className="text-primary hover:text-primary/80">
                    <p>How to set up a business account.</p>
                  </a>
                </div>
                <div className="flex bg-grey flex-col p-3 gap-2">
                  <p>Link your Instagram business account to a Facebook fan page.</p>
                  <a href="javascript:void(0)" className="text-primary hover:text-primary/80">
                    <p>How to link to a Facebook fan page.</p>
                  </a>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p>
                  Still Need Help?{' '}
                  <a
                    href="javascript:void(0)"
                    className="text-primary hover:text-primary/80 font-semibold"
                  >
                    Watch Tutorial
                  </a>{' '}
                  or{' '}
                  <a
                    href="javascript:void(0)"
                    className="text-primary hover:text-primary/80 font-semibold"
                  >
                    Chat with us
                  </a>
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="w-[400px] max-w-[95vw] p-6 border-gray-200">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">Delete Channel</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Are you sure you want to delete this channel? This action cannot be undone and will
              disconnect your integration.
            </p>
            <div className="flex justify-end gap-3 mt-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (instagramData?.uuid) {
                    mutateDeleteChannel({ uuid: instagramData.uuid });
                  }
                }}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstagramChannel;
