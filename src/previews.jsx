import App from "@/app/Logistics/Docs/page";
import {ComponentPreview, Previews} from '@react-buddy/ide-toolbox-next'
import {PaletteTree} from './palette'

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/App">
                <App/>
            </ComponentPreview>
        </Previews>
    )
}

export default ComponentPreviews