import { FacebookIcon } from '@/assets/icons';
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { changeOmniStatus, getSocialMediaChannelList, deleteOmniChannel } from '@/services/api';
import { Trash2 } from 'lucide-react';

import { useUser } from '@/hooks/use-user';

const FacebookChannel = () => {
  const [isFacebookModalOpen, setIsFacebookModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();

  const { data: channelList = [], isLoading: isLodingChannelList } = useQuery({
    queryKey: ['getSocialMediaChannelList'],
    queryFn: () => getSocialMediaChannelList(),
    select: (data) => data?.data?.data?.result || [],
  });

  const facebookData =
    channelList &&
    channelList?.find((item: { name: string; type: string }) =>
      ['messenger', 'facebook'].includes(item?.type),
    );

  const isFacebookConnected = !!facebookData;
  console.log(isFacebookConnected, 'isFacebookConnected', channelList, facebookData);

  const handleConnect = () => {
    connectMetaChannel('messenger', setLoading, user?.company_info?.uuid);
  };
  const queryClient = useQueryClient();
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
  return (
    <div>
      <ChannelCard
        icon={<FacebookIcon className="w-6 h-6" />}
        tone="facebook"
        name="Facebook & Messenger"
        description="Handle Messenger chats and Page comments from your Facebook Business account."
        /* DEMO fallback — remove with DEMO_CHANNELS before release. */
        isConnected={isFacebookConnected || DEMO_CHANNELS.facebook.connected}
        account={DEMO_CHANNELS.facebook.account}
        capabilities={DEMO_CHANNELS.facebook.capabilities}
        isLoading={isLodingChannelList}
        onConnect={() => setIsFacebookModalOpen(true)}
        onManage={handleConnect}
        onDelete={() => setIsDeleteModalOpen(true)}
        switchChecked={facebookData ? facebookData.status === 1 : Boolean(DEMO_CHANNELS.facebook.enabled)}
        onSwitchChange={(checked) => {
          if (facebookData?.uuid) {
            mutateStatusChange({ uuid: facebookData.uuid, status: checked ? 1 : 0 });
          }
        }}
      />


      <Dialog open={isFacebookModalOpen} onOpenChange={setIsFacebookModalOpen}>
        <DialogContent className="w-[520px] max-w-[95vw] p-0 overflow-hidden border-gray-200">
          <div className="p-6 flex flex-col gap-5">
            <DialogHeader className="gap-2 text-left">
              <DialogTitle>Facebook Setup</DialogTitle>
              <DialogDescription>
                Connect your Facebook Business account and set up Messenger for your page.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-start gap-5">
              <Button onClick={handleConnect} disabled={loading}>
                {loading ? 'Connecting...' : 'Connect Facebook Page'}
              </Button>
              <div className="flex flex-col gap-2">
                <p>To connect your Facebook page you must be the admin of the page.</p>
                <p>
                  Need Help?{' '}
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
                  if (facebookData?.uuid) {
                    mutateDeleteChannel({ uuid: facebookData.uuid });
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

export default FacebookChannel;
