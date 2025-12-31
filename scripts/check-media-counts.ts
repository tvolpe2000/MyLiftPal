import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { count: total } = await supabase
    .from('exercises')
    .select('id', { count: 'exact', head: true });

  const { count: withVideo } = await supabase
    .from('exercises')
    .select('id', { count: 'exact', head: true })
    .not('video_url', 'is', null);

  const { count: withImage } = await supabase
    .from('exercises')
    .select('id', { count: 'exact', head: true })
    .not('image_url', 'is', null);

  console.log('Total exercises:', total);
  console.log('With video_url:', withVideo);
  console.log('With image_url:', withImage);
}

check();
