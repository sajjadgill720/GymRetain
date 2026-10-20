import { notFound } from 'next/navigation';
import { PortalPage } from '@/components/portal/PortalPages';
const sections=['classes','rewards','progress','me','pass','diet','chat','membership','onboarding','profile','help','buddies'];
export default function Page({params}:{params:{section:string}}) {if(!sections.includes(params.section))notFound();return <PortalPage section={params.section}/>;}
