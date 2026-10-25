import {useRef,useEffect} from 'react';
import {mountApp} from '../shared/app.js';
export default function App(){const ref=useRef<HTMLDivElement>(null);useEffect(()=>{if(!ref.current)return;return mountApp(ref.current,'./')},[]);return <div ref={ref}/>}
