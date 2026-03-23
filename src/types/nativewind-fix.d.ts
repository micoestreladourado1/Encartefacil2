import "react";
import "react-native";

declare module "react-native" {
    export const View: any;
    export const Text: any;
    export const Image: any;
    export const TouchableOpacity: any;
    export const TextInput: any;
    export const FlatList: any;
    export const ActivityIndicator: any;
    export const Modal: any;
    export const Switch: any;
    export const ScrollView: any;
    export const Pressable: any;
    export const SafeAreaView: any;
}

// Fix for general React 19 JSX conflicts
declare global {
    namespace JSX {
        interface Element extends React.ReactElement<any, any> { }
        interface IntrinsicAttributes {
            className?: string;
        }
    }
}

// React 19 specific JSX namespace
declare module "react/jsx-runtime" {
    namespace JSX {
        interface Element extends React.ReactElement<any, any> { }
        interface IntrinsicAttributes {
            className?: string;
        }
    }
}

declare module "react/jsx-dev-runtime" {
    namespace JSX {
        interface Element extends React.ReactElement<any, any> { }
        interface IntrinsicAttributes {
            className?: string;
        }
    }
}
