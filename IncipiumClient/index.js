
import { AppRegistry } from 'react-native'; //importing a class from a package
import MainApp from './MainApp'; // Ensure you have the correct relative path, importing 
                                // another package from another file
import { name as appName } from './app.json'; //assigning name

AppRegistry.registerComponent(appName, () => MainApp); // registering the app class as a component
