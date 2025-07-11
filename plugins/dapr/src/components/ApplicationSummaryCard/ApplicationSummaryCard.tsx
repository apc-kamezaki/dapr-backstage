import { EmptyState, InfoCard, Link } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { Box, Button, Chip, Typography } from '@material-ui/core';
import GetAppIcon from '@material-ui/icons/GetApp';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { daprApiRef } from '../../api';
import { ApplicationInstance } from '../../types';
import { downloadManifest } from '../../utils/downloadManifest';
import { useDaprApplicationId } from '../../utils/isDaprAvailable';
import { useDaprUI } from '../../utils/isDaprUiConfigured';
import { CopyButton } from '../shared-components/CopyButton';
import { DisplayItem } from '../shared-components/DisplayItem';

export type ApplicationSummaryCardProps = {
  /** Size variant of the card. Default is empty string */
  size?: 'small' | '';
};

export const ApplicationSummaryCard = ({
  size = '',
}: ApplicationSummaryCardProps) => {
  const applicationId = useDaprApplicationId();
  const DaprAPI = useApi(daprApiRef);
  const [data, setData] = useState<ApplicationInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await DaprAPI.getApplicationInstance(applicationId);

        if (!response) {
          throw new Error(`Wrong application id`);
        }

        setData(response);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [DaprAPI, applicationId]);

  const daprUIUrl = useDaprUI();
  const title = daprUIUrl ? (
    <>
      {`Dapr App Id: `}
      <Link to={`${daprUIUrl}/${applicationId}`}>{`${applicationId}`}</Link>
    </>
  ) : (
    `Dapr App Id: ${applicationId}`
  );

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error || !data) {
    return (
      <EmptyState
        missing="data"
        title="No data to show"
        description="Check if the application_id is correct or if there is any connectivity issue with the Dapr API"
      />
    );
  }

  return (
    <InfoCard
      title={
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gridGap="0.5rem"
        >
          <Box>
            <Typography variant="h5">{title}</Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<GetAppIcon />}
              onClick={() => downloadManifest(data.manifest, applicationId)}
              disabled={!data.manifest || !applicationId}
            >
              Download Manifest
            </Button>
          </Box>
        </Box>
      }
    >
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: size === 'small' ? '2fr 4fr' : '3fr 4fr 5fr',
          gap: '1rem',
          padding: '0 0.25rem',
        }}
      >
        <Box>
          <DisplayItem label="App Port">
            <Typography variant="body1">
              <span>{data.appPort}</span>
            </Typography>
          </DisplayItem>

          <DisplayItem label="HTTP Port">
            <Typography variant="body1">
              <span>{data.httpPort}</span>
            </Typography>
          </DisplayItem>

          <DisplayItem label="GRPC Port">
            <Typography variant="body1">
              <span>{data.grpcPort}</span>
            </Typography>
          </DisplayItem>
        </Box>
        <Box>
          <DisplayItem label="Address">
            <Typography
              variant="body1"
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <span>{data.address}</span>
              <CopyButton text={data.address} />
            </Typography>
          </DisplayItem>
          <DisplayItem label="Created">
            <Typography variant="body1">
              {format(new Date(data.created), 'dd/MMM/yyyy HH:mm:ss zzzz')}
            </Typography>
          </DisplayItem>
          <DisplayItem label="Age">
            <Typography variant="body1">{data.age}</Typography>
          </DisplayItem>
        </Box>
        <Box>
          <DisplayItem label="Labels" style={{ margin: '0' }}>
            <Typography variant="body1">
              {data.labels ? (
                <LabelsList labels={data?.labels?.split(',')} />
              ) : (
                'No labels'
              )}
            </Typography>
          </DisplayItem>
        </Box>
      </Box>
    </InfoCard>
  );
};

function LabelsList({ labels }: { labels: string[] }) {
  return (
    <Box>
      {labels.map(label => (
        <Chip key={label} label={label} />
      ))}
    </Box>
  );
}
